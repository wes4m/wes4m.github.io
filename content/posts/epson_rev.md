---
title: "Reverse engineering thermal printers"
date: 2022-09-02T21:29:19+03:00
draft: false
description: ""
# weight: 1
aliases: ["/epsonrev"]
tags: ["Network", "Reverse"]
# author: ["Me", "You"] # multiple authors
author: "wes4m"
dir: "ltr"

showToc: false
TocOpen: false
hidemeta: false
comments: false
disableHLJS: true
disableShare: false
disableHLJS: false
hideSummary: true
searchHidden: true
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: false
ShowRssButtonInSectionTermList: false
UseHugoToc: false
cover:
    image: "/images/epsonrev-cover.png" # image path/url
    alt: "" # alt text
    caption: "" # display caption under cover
    relative: false # when using page bundles set this to true
    hidden: true # only hide on current single page
---


A significant part of my current work involves dealing with thermal printers to print receipts, invoices, item slips etc ..; For those unfamiliar. I'm talking about those usually small cashier side printers that print your receipts when you buy something from a restaurant, or any other shop.

Thermal printers use a universal protocol to send/receive printing commands. This protocol is called `ESC/POS`. For anyone stumbling on to this post trying to figure-out what the heck is going on with those printers, I feel you. Buffering issues, printer not printing, queuing issues, junk printing, delayed printing, connection loss, data leaks, the list goes on. At some point, I started wondering why does EPSON printers have none of these issues while others did? This led to the curious investigation and reverse engineering of the EPSON TM-m30 printer.

First, Some nuances there are multiple versions of `ESC/POS`. Not officially. But there are many minor differences between manufacturers making different models of those thermal printers. Each deciding to add custom `ESC/POS` functions, since the protocol allows that. Some ignoring certain `ESC/POS` commands. And many having undocumented methods. Some provide their own SDKs like EPSON, who by the way, are the creators of `ESC/POS`. What makes this hard to discover is that an `ESC/POS` SDK will usually work and print on all the printers you have. Until it doesn't for some unknown reason. To fix issues you will probably start adding random delays; and that will work for a while. Then, network speed will break it, print page size could break it, using different OS? will break it. You will try managing the queue yourself. Even that is still not a fix. Everything you end up doing is basically guesswork trying to support a bad protocol that lacks necessary feedback, queuing, and other important functionalities. 

## EPSON's Fix
The obvious solution of course, is to have a better protocol/s that communicate back printing status feedback, does error handling/correction, and queuing. This is exactly what EPSON did. A proprietary modified `ESC/POS` combined with another proprietary protocol for orchestrating printing, discovery, etc ...

# RE 1
So I went to work. Trying to take the easier path I downloaded EPSON's JS SDK looking for their discovery method. The discovery method allows the SDK to discover all of EPSON's thermal printers connected to the network/bluetooth/USB. Since it was something not supported by `ESC/POS` itself, it must come from a different protocol. Turns out, their JS SDK does not have any of the methods I was looking for. Moving on, I downloaded their Windows SDK and started digging into it using IDA. During that time, I had a background Nmap scan running for all TCP/UDP ports the printer was listening to. 


Results:
```
TCP 9100 which is the normal ESCPOS port
TCP 443 which is the web server for admin and some API
UDP 161 SNMP
UDP 3289 ??

```

Searching for port 3289 yields results about an `ENPC` protocol [ECSP_SecurityGuideline_v1.1.1.pdf](https://support.epson-europe.com/LFP/ECSP_SecurityGuideline_v1.1.1.pdf)
![ENPC](/images/ENPC_mention.png)

There is also this [Stackoverflow question](https://stackoverflow.com/questions/62870327/where-to-find-the-documentation-of-enpc-udp-port-3289-printer-discovery) looking for `ENPC` documentation with a few comments linking to different `ENPC` references including one 2017 [Github repo BlackLotus/epson-stuff](https://github.com/BlackLotus/epson-stuff) of an incomplete attempt at reversing `ENPC`.

Looking more into the de-compiled SDK. I find the function `EpsonIoDiscoveryStart`. Following its calls I ended up at the Discovery thread which contained a loop that kept sending a UDP packet to the `ENPC` port starting with the string `ENPCQ` as shown below

![ENPCQ-1](/images/enpcq-1.png)

After sending it, it will try to receive a response as shown below.
![ENPCQ-2](/images/enpcq-2.png)

Using the received response a comparison on the first 6 bytes of the packet will take place and later on the function `EpsonIoUpdatePrinterList` appears.
![ENPCQ-3](/images/enpcq-3.png)

Looking deeper into it, there didn't seem to be any security mechanism in place. And trying to avoid IDA as much as I could. I decided to consider this enough data gathered to fire up Wireshark and start monitoring what a discovery exchange looks like for `ENPC`.

![RVI0-1](/images/rvi0-1.png)
At first glance, the device running the SDK and doing a discovery (IP `192.168.1.23`) sends a broadcast packet. Then the printer (IP `192.168.1.9`) replies. This exchange, alongside other packets in between, kept repeating.

Filtering for important data the result is as shown.
![RVI0-2](/images/rvi0-2.png)

It repeats in a blocks of 6 packets starting with the broadcast packet. This went on even after discovery, which means that the SDK continues to send discovery packets even after the printer is identified.


Digging into the packets I started to notice some patterns.
![RVI0-3](/images/rvi0-3.png)
![RVI0-4](/images/rvi0-4.png)

It looks like every message going out from the SDK is starting with the `EPSONQ` string. The same string I found in IDA. While the response from the printer starts with `EPSONq`. There are also other packets going out from the SDK starting with the string `EPSONC` while the response starts with `EPSONc`.
This looked like how `ENPC` was differentiating between `Q = QUERY` and `q = QUERY RESPONSE`. Also, `C = COMMAND` and `c = COMMAND RESPONSE`.

Having figured out the first part of the packet. I started looking into the following bytes. It seemed like the next 4 bytes coming after the `EPSON{X}`, X being either a query/command message/response, were also consistent between message and response. The bytes after those 4 bytes were also always of consistent size. This was good enough to identify those 4 bytes as the Query or Command `function/operation number`. 
With this in mind. The initial discovery query message had another 4 bytes. 

```
0000   45 50 53 4f 4e 51 03 00 00 00 00 00 00 00         EPSONQ........

EPSONQ = Query message
03 00 00 00 = Function number
00 00 00 00 = ??
```

Considering this. I started looking into the other packets and noticed that some packets had extra bytes. For those packets, the unidentified 4 bytes were reflecting a number equal the number of the extra bytes. This was clear that the 4 Bytes meant the size of the coming message/response.

**Something interesting?** The ability to control message/response body length presents a good opportunity to test for buffer overflow. Data leaks, crashes ..
I actually only noticed this while writing this post and will probably test it later. EPSON RCE maybe? :P.

Anyway, on to the next packet
```
0000   45 50 53 4f 4e 71 03 00 00 00 00 00 00 85 00 05   EPSONq..........
0010   01 02 01 54 4d 2d 6d 33 30 00 00 00 00 00 00 00   ...TM-m30.......
0020   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
0030   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
0040   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
0050   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
0060   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
0070   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
0080   00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00   ................
0090   00 00 00                                          ...

EPSONq = Query response
03 00 00 00 = Function number
00 00 00 85 = Response size
Extra bytes = the response which had the printer model name and matched the response size
```

Looking into more packets
```
0000   45 50 53 4f 4e 71 00 00 00 10 00 00 00 17 01 02   EPSONq..........
0010   00 00 00 00 00 00 04 c0 a8 01 09 ff ff ff 00 c0   ................
0020   a8 01 01 80 7c                                    ....|

EPSONq = Query response
00 00 00 10 = Function number (different function)
... 
```

Now this packet had non-ASCII data. However, if you've ever done network stuff in hex you would notice something very familiar. `ff ff ff 00` this is equivalent to `255.255.255.0` which happens to be my network netmask. 
Converting the other bytes to IPs I got matches for the printer IP, MAC address, and the network gateway IP.

So far, I know that every query/command, for both message and response, follows this structure.
```
export interface ENPCMessage {
    QC: string,
    type_hex: string,
    func_hex: string,
    data_len_hex: string,
    data_hex: string
}
```

Following the same process. through trial and error. I started printing and analyzed the packets. Identifying the most important functions list of `ENPC` queries/commands as follows

```
export const ENPC_QUERIES = {
    [ENPC_QUERY_FUNCTIONS.DISCOVER_INFO_BROADCAST]: "00000000",
    [ENPC_QUERY_FUNCTIONS.DISCOVER_INFO]: "03000010",
    [ENPC_QUERY_FUNCTIONS.DISCOVER_DEVICE_NAME]: "03000000",
    [ENPC_QUERY_FUNCTIONS.WHO_IS_HOLDING]: "03000017",

    [ENPC_QUERY_FUNCTIONS.UNKNOWN_DISCOVER]: "00000010",
};

export const ENPC_COMMANDS = {
    [ENPC_COMMAND_FUNCTIONS.UNKNOWN_COMMAND_1]: "03000015",
    [ENPC_COMMAND_FUNCTIONS.UNKNOWN_COMMAND_2_CHECK]: "03000016"
};
```

At this point, I thought about writing a simple spoofer that listens on port 3289 and broadcasts itself as `TM-m30` printer. Attempting it with a simple replay of packets did not work, obviously. Because the SDK tries to reach the printer using the provided information from the `DISCOVER_INFO` query response. This meant that I needed to also build packets with the `spoofer` device info (ip, and mac address). This was fairly easy with all the important queries identified. 

```
private getQueryResponse(function_hex: string): Uint8Array | undefined {
    const func_name = dictContainsValue(ENPC_QUERIES, function_hex);

    if (func_name) {
        let response: Uint8Array | boolean | undefined = false;

        if (func_name == ENPC_QUERY_FUNCTIONS.DISCOVER_INFO_BROADCAST) {
            response = this.ENPC_parser.makeENPC(
                "q",
                ENPC_QUERIES.DISCOVER_INFO_BROADCAST,
                "00000036",
                `55422d45454145303833454e534e0000000000000000000000000000000000000001ffff15000200${this.mac_address}0000000100000001`
            );
        }

        if (func_name == ENPC_QUERY_FUNCTIONS.DISCOVER_DEVICE_NAME) {
            response = this.ENPC_parser.makeENPC(
                "q",
                ENPC_QUERIES.DISCOVER_DEVICE_NAME,
                "00000085",
                `0005010201544d2d6d33300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`
            );
        }

        if (func_name == ENPC_QUERY_FUNCTIONS.UNKNOWN_DISCOVER) {
            response = this.ENPC_parser.makeENPC(
                "q",
                ENPC_QUERIES.UNKNOWN_DISCOVER,
                "00000017",
                `01${this.mac_address}0004${this.ip}${this.netmask}${this.gateway}807c`
            );
        }

        if (func_name == ENPC_QUERY_FUNCTIONS.DISCOVER_INFO) {
            response = this.ENPC_parser.makeENPC(
                "q",
                ENPC_QUERIES.DISCOVER_INFO,
                "0000000d",
                `0e1400000fffffffff39414000`
            );
        }

        if (func_name == ENPC_QUERY_FUNCTIONS.WHO_IS_HOLDING) {
            // 00 00 00 00 = No one is holding
            // Anything else = ip address for ip holding it
            let current_holding_ip = "00000000";
            if (this.is_holding) {
                current_holding_ip = this.holding_ip;
            }
            response = this.ENPC_parser.makeENPC(
                "q",
                ENPC_QUERIES.WHO_IS_HOLDING,
                "00000004",
                current_holding_ip
            );

        }

        if (response) {
            console.log(`\tResponding to query with: ${bytesToHexString(response)}`)
            return response;
        }
    }

    console.log("\tTrying to respond to a function not in queries list");
    return undefined;
}
```

Listening on port 3289. Then responding with the above responses; successfully broadcasted a fake `TM-m30` printer.

## RE 2
With the most important parts of `ENPC` reversed and emulated. The idea of the protocol was much clearer. It handled discovery of printers. It also checked through the `WHO_IS_HOLDING` query for who is holding the printer. If the printer responded with the asking device's ip the SDK will proceed and attempt to print. If it responded with zeros, it will also proceed and connect to the `ESC/POS` port 9100 and attempt to print. However, if any other IP was holding, the SDK will wait. As soon as a connection is established to port 9100. The holding IP is updated. That is basically what EPSON did to solve holding and prioritizing issues during printing with multiple devices. This is also what all other printers lacked. Now, there are still other issues with `ESC/POS` that this simple `ENPC` holding check is not enough to fix.

Next in line was attempting to print using the emulated printer and watching the `ESC/POS` data flow. However. the TM-m30 had other tricks built in into its `ESC/POS` allowing it to be more reliable and preventing a simple replay of packets from working.
Starting with regular status messages from the printer to the SDK through `ESC/POS`. Also, better queuing.

I was able to identify many of the commands through the [ESC/POS Spec documentation](https://aures-support.com/DATA/drivers/Imprimantes/Commande%20ESCPOS.pdf). But, many of the commands sent from the printer were custom to the EPSON printer.

The `ESC/POS` printing process always started with a `DLE DOT n` command asking for real time transmission of printer status. (Which many printers did not implement!)
![ESCPOS-1](/images/ESCPOS-1.png).

The SDK will also attempt to periodically enable Automatic Status Back (ASB) expecting a response of `1400000f`.
There are many other `ESC/POS` exchanges that were missing from other printers. I decided to skim over those and just replay them back without understanding.

```
if (hex_data == "100401") {
    socket.write(hexStringToBytes("16") as Uint8Array);
}
if (hex_data.includes("1d61ff")) {
    socket.write(hexStringToBytes("1400000f") as Uint8Array);
}
if (hex_data == "1b3d011d2845020006031d496e1b3d011d28450200060b") {
    socket.write(hexStringToBytes("3727331f3600") as Uint8Array);
    socket.write(hexStringToBytes("3d6e00372731311f3000") as Uint8Array);
}
if (hex_data == "10140801031401060208") {
    socket.write(hexStringToBytes("372500") as Uint8Array);
}
if (hex_data == "101406040001031401060208") {
    socket.write(hexStringToBytes("375c3000") as Uint8Array);
}
```


Replaying packets was almost enough to get the `ESC/POS` printing process completed. However, one critical part was missing. an EPSON modified `ESC/POS` print-job queuing functionality! (The most important missing future causing issues in the other printers). As you can see below, at the end of EPSON's `ESC/POS` printing commands, it sends a QR Model Select command. That's weird, I wasn't printing any QR codes. Also, the QR model function and other values did not match the `ESC/POS` spec. 

![ESCPOS-2](/images/ESCPOS-2.png)
![ESCPOS-3](/images/ESCPOS-3.png)

The printer was responding with the same ASCII string `000001` appearing at the end in the QR Model select command.
![ESCPOS-4](/images/ESCPOS-4.png)

This ascii string changes to `000002` then `000003` with each print. Making it clear that this command is used to queue printing jobs and report their status back `done` to the SDK. With the last missing part understood. I started handling the command.


```
if(hex_data.includes("1d28480600")) {
    // Sets print job number and starting printing the buffer

    // Get Counter for current print-job
    const counter = hex_data.split("1d28480600")[1].slice(4);
    instance.ESCPOSLastPrintJobCounter = counter;
    socket.write(hexStringToBytes("1400000f") as Uint8Array);

    if (instance.ESCPOSLastConnectionSocket) {
        // Send that ESCPOS printing-job is done (custom EPSON message)
        socket.write(hexStringToBytes(`3722${instance.ESCPOSLastPrintJobCounter}00`) as Uint8Array);

        instance.ESCPOSLastConnectionSocket.destroy();
        instance.is_holding = false;
        instance.holding_ip = "00000000";
        instance.ESCPOSLastConnectionSocket = undefined;
        instance.ESCPOSLastPrintJobCounter = undefined;

        // Get image from last stored ESCPOS data
        generate_merged_bitmap_png(escpos_data_stored, [0]).then( (png_path) => {
            if (png_path) {
                instance.onReceipt(png_path);
            }
        });

        escpos_data_stored = "";
    }
}
```


With all that done. Now I can broadcast a TM-m30 printer. Connect to it, and get the `ESC/POS` data from print-jobs. 

## Extra ?
To have more fun I decide to fire up Square POS. Connect to the printer and attempt to get the printer receipt. However, when I found no encoded text in the `ESC/POS` print data. I figured that Square was sending bitmap images instead of text. How to extract that? with some borrowed help from [escpos-tools](https://github.com/receipt-print-hq/escpos-tools) I wrote the following image processor which extracts the graphics data. Merges the bitmaps (since Square sends multiple) and converts it to a `PNG` using ffmpeg. 

```
import { Buffer } from "buffer";
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from "react-native-fs";

interface BitmapImage {
    height: number,
    width: number,
    bitmap: Buffer
}


// GS = 0x1D
// ? = 0x38
// GraphicsLargeDataCmd = 0x4C
const ESCPOS_GRAPHICS_LARGE_DATA_CMD = "1d384c";

/*
command  datasize      a1 a2                                x1   x2  y1   y2    data(len = datasize)
1d384c c2 1a 00 00     30 70        00    00    00   00     00   00  00   00    0000000000000000...
*/
const parseGraphicsDataBlocks = (graphics_hexdata_blocks: string[]): (BitmapImage | undefined)[] => {

    return graphics_hexdata_blocks.map((graphics_hexdata_block: string, index: number) => {
        
        let workable_graphics_hexdata_block = graphics_hexdata_block;

        // Extract datasize indicators (4 bytes)
        let datasize_indicators = workable_graphics_hexdata_block.slice(0, 4 * 2).match(/.{1,2}/g) as any;
        workable_graphics_hexdata_block = workable_graphics_hexdata_block.slice(4*2);
        datasize_indicators = datasize_indicators?.map( (n: string) => parseInt(n, 16)) as number[];

        // Extract a1 = ?, a2 = 0x70 = StoreRasterFmtDataToPrintBufferGraphicsSubCmd (2 bytes)
        const [a1, a2] = workable_graphics_hexdata_block.slice(0, 2 * 2).match(/.{1,2}/g) as any;
        workable_graphics_hexdata_block = workable_graphics_hexdata_block.slice(2*2);

        // Pass over filler (4 bytes)
        workable_graphics_hexdata_block = workable_graphics_hexdata_block.slice(4*2);

        // Extract dimensions_indicators
        let dimensions_indicators = workable_graphics_hexdata_block.slice(0, 4 * 2).match(/.{1,2}/g) as any;
        workable_graphics_hexdata_block = workable_graphics_hexdata_block.slice(4*2);
        dimensions_indicators = dimensions_indicators.map( (n: string) => parseInt(n, 16)) as number[];

        // Confirm function is StoreRasterFmtDataToPrintBufferGraphicsSubCmd
        if (a2 != "70") return;

        // Calculate datasize (Not used)
        const [d1, d2, d3, d4] = datasize_indicators;
        let datasize = (d1 + (d2 * 256) + (d3 * 65536) + (d4 * 16777216)) - 2;

        
        // Calculate width and height
        const [x1, x2, y1, y2] = dimensions_indicators;
        const width = x1 + (x2 * 256);
        const height = y1 + (y2 * 256);


        // Extract data
        let graphics_data = workable_graphics_hexdata_block.slice(0, ((width * (height)) / 8) * 2);

        // Convert to buffer
        const bitmap = Buffer.from(graphics_data, "hex");
        

        // Logging
        console.log(`\n[BLOCK #${index}]`);
        console.log(`\tDatasize indicators (d1, d2, d3, d4): ${datasize_indicators}`);
        console.log(`\tDatasize: ${datasize}`);
        console.log(`\tDimensions indicators (x1, x2, y1, y2): ${dimensions_indicators}`);
        console.log(`\tDimensions (w, h): (${width}, ${height})`);
        // Should be same as datasize
        console.log(`\tBitmap data length: ${bitmap.length}`);

        return {
            width: width,
            height: height,
            bitmap: bitmap
        }

    });

}

const getESCPOSGraphics = (hexdata: string): (BitmapImage | undefined)[] | undefined => {

    // Look for graphics cmds
    const graphicsLargeDataBlocks = hexdata.split(ESCPOS_GRAPHICS_LARGE_DATA_CMD);
    if (!graphicsLargeDataBlocks.length) return;

    // removes first (useless) item in array 
    graphicsLargeDataBlocks.shift();

    const bitmap_images = parseGraphicsDataBlocks(graphicsLargeDataBlocks);
    return bitmap_images;
}


const bitmapImageToPBM = (bitmap_image: BitmapImage): Buffer => {
    const header = Buffer.from("P4\n" + bitmap_image.width + " " + bitmap_image.height + "\n");
    const buffers = [header, bitmap_image.bitmap];
    return Buffer.concat(buffers);
}

const mergeBitmapImages = (bitmap_images: BitmapImage[]): BitmapImage => {
    // Using first width
    return {
        width: bitmap_images[0].width,
        height: bitmap_images.reduce((p, current) => p + current.height, 0), 
        bitmap: Buffer.concat(bitmap_images.map( bitmap_image => bitmap_image.bitmap))
    }
}


export const generate_merged_bitmap_png = async (hex_escpos_data: string, skip_indecies: number[]): Promise<string | undefined> => {
    return new Promise<string | undefined>( async (resolve, reject) => {


        let bitmap_images = getESCPOSGraphics(hex_escpos_data);
        if (bitmap_images) {

            bitmap_images = bitmap_images.filter( (_, index) => !skip_indecies.includes(index) );
            const bitmap_images_merged = mergeBitmapImages(bitmap_images as BitmapImage[]);
            const pbm_image = bitmapImageToPBM(bitmap_images_merged);
            const pbm_path = RNFS.DocumentDirectoryPath + `/escpos-print.pbm`;
            const png_path = RNFS.DocumentDirectoryPath + `/escpos-print.png`;
    
            let buf = '';
            pbm_image.map((v, i, a) => {
                buf += String.fromCharCode(v);
                return 0;
            })
           

            RNFS.writeFile(pbm_path, buf, 'ascii').then((success) => {
                console.log('FILE WRITTEN! to', pbm_path);

                FFmpegKit.execute(`-y -i ${pbm_path} ${png_path}`).then(async (session) => {
                    const returnCode = await session.getReturnCode();
                    if (ReturnCode.isSuccess(returnCode)) {
                      // SUCCESS
                      console.log('FILE WRITTEN! to', png_path);
                      resolve(png_path);
                   } else {
                      // ERROR
                      reject();
                    }
                  });

            }).catch((error) => {
                console.log(error);
                reject();
            })

        }


    });
}
```

I made the project using react-native, and typescript in order to broadcast the printer using my mobile device, then get the printed image in view for fun. This was the end result 
![result](/images/result.png)

## Conclusion
Other than having fun, and hopefully this post being helpful to someone. The project was of no help in discovering a solution to other printers. There are in my opinion no solutions, other than having a printer run a custom firmware, using an EPSON printer, or any other printer that has a custom firmware and SDKs. There is a reason why many POS systems only support a specific set of printers.
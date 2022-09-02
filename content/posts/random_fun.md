---
title: "Fuzzing, Emulation, and Random low-level fun #1"
date: 2020-12-27 03:49:01 -0700
draft: false
description: ""
# weight: 1
# aliases: ["/first"]
tags: ["Random"]
# author: ["Me", "You"] # multiple authors
author: "wes4m"
dir: "ltr"

showToc: false
TocOpen: false
hidemeta: false
comments: false
disableHLJS: false
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
    image: "<image path/url>" # image path/url
    alt: "<alt text>" # alt text
    caption: "<text>" # display caption under cover
    relative: false # when using page bundles set this to true
    hidden: true # only hide on current single page
---



As the **amazing** year of 2020 comes to an end, I thought that this is the right time for me to start thinking about how to get involved in areas I have always been interested in but never put enough time and effort into.  Basically, this is going to be a hands-on semi random blog post series of exploring mostly low-level computer science and security topics. The plan is to have no rigid plan, go by interest, and to have fun. This first post is just laying out a possible timeline of the topics and ideas I will be going through and will later be updated to link the specific blog posts.



## Fuzzing

Not web applications fuzzing. I have always been interested in fuzzing. Whenever reading a writeup of some mind-blowing RCE the common entry point for that bug, or chain of bugs is usually fuzzing. I've done some fuzzing but not enough. So ..

- **Let's build a fuzzer, or multiple fuzzers?, and incremntally optimize it.**

Building a fuzzer will be fun, but what fun with no bugs. Before trying to choose a target. I wanted to re-discover a previously known exploitable CVE through fuzzing,  Then, create an exploit for it. 

* **Re-discovering a bug, and writing an exploit for it.**

At this point I'd hope that I've made a few blog posts and gained a better understanding of fuzzers. Before continuing with fuzzers though, I will take a quick detour and comeback to them later.

## Emulation 

Emulation can be a very useful tool for fuzzing. As sometimes you want to fuzz a black-box target, a kernel, or something running on a different arch. However, this is just an execuse to make an emulator. I have always wanted to make an emulator for a simple archictucture. 

*  **Making an emulator for something (NES?, idk will choose later).** 

I know that [AFL](https://github.com/google/AFL) has a [QEMU](https://github.com/qemu/qemu) mode (user only) for black-box targets. So while we're at it with emulators. Let's learn some stuff about QEMU, and maybe modify AFL to fuzz a binary running inside an emulated OS.

* **Modify AFL, QEMU to fuzz a black-box target in a different OS (SerenityOS?)**
  *  **I like SerenityOS and have learned a lot from Andreas Kling ([@awesomekling](https://twitter.com/awesomekling)) videos, so why not :D**

## Fuzzing part 2 (goal)

in the second part of fuzzing, also known as finding a previously unknown exploitable bug through fuzzing (0-Day), and writing an exploit for it. I will try to do what it exactly says. I expect this to be the hardest part and I'm considering it a goal for 2021. The target doesn't have to be big. The main reason I think this will be hard is because I struggle with choosing a target just for the sake of finding a bug. I usually find bugs in a target when I'm exploring it for a specific reason.

* **Find a bug in "something" through fuzzing, and write an exploit for it.**

## Hypervisors 

Just putting this one out here. I want to learn more about hypervisors and make a simple one. 

* **Making a hypervisor.**

------

This is it for now. Ideas could change, get extended, and more ideas might be added. Here hoping for a better year, plz 2021 🙏, and more learning.

**UPDATE**: 2021 Also sucked. I don't remember if I did any of the above.

**UPDATE**: 2022 Uhhh ...

<p align="center">
  <img src="https://media1.tenor.com/images/5b04f7e51bd8659b985b8aa4f86ffedc/tenor.gif?itemid=4472291">
</p>

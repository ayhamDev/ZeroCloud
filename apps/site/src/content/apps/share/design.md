---

title: Design
description: How Share is intended to connect two devices, and the choices still open.
order: 1
---

## One local connection

Imagine a laptop connected to a router by Ethernet and a phone connected to that router over Wi-Fi. If the router allows the devices to reach each other, they already have a path for local traffic. The router can keep that path available when its internet link goes down.

Share’s design calls for pairing and transferring files over that path. A hosted directory, signaling service, or internet relay would make an essential step depend on someone else’s infrastructure.

## Finding the other device

Local discovery and a QR code are two approaches under consideration. Discovery could let nearby devices announce themselves. A QR code could supply connection information directly to the other device. Either approach still needs a reachable network path and a way to verify the intended recipient.

## Where the design stands

The repository contains desktop and Android shells. Peer discovery, pairing, transfer approval, security design, and file transport are future work. A shared Wi-Fi name alone does not guarantee that clients can communicate. Guest networks can isolate each device from its neighbours.

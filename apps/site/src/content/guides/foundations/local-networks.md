---

title: Local networks
description: What connects two nearby devices when the internet is unavailable.
group: Foundations
order: 10
keywords: [wifi, Wi-Fi, LAN, router, guest, offline, peers, discovery, QR]
---

## The local path

A laptop connected by Ethernet and a phone connected by Wi-Fi may be on the same local network. Their traffic can travel through the local switch or access point without going out to an internet provider.

An internet outage and a local network outage are different events. If the router loses power, the local path can disappear too.

## Reachability comes first

Some guest networks deliberately prevent clients from communicating. Firewalls can also block incoming connections. Being connected to the same Wi-Fi name is a useful first clue, but it is insufficient to establish reachability.

## How this shapes Share

Share is intended to connect the sender and recipient on the local network. A QR code could tell one device where to look. It could not, by itself, make an isolated peer reachable. The project has yet to choose a pairing method or implement transfer networking.

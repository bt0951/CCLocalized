import { EventTarget } from "./EventTarget"

export let eventCenter: EventTarget = new EventTarget()

if (CC_DEBUG) {
    //@ts-ignore
    window.eventCenter = eventCenter
}

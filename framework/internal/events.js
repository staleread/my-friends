const eventHandlingMap = new Map([
    [
        'Click',
        {
            nativeEvent: 'click',
            handler(event) {
                let node = event.target._ref;

                while (node && !event.defaultPrevented) {
                    if (node.type !== 'TagNode') {
                        node = node.parent;
                        continue;
                    }
                    const handler = node.eventsMap.get('Click');

                    if (handler) handler(event);
                    node = node.parent;
                }
            }
        }],
    [
        'Submit',
        {
            nativeEvent: 'submit',
            handler(event) {
                let node = event.target._ref;

                while (node && !event.defaultPrevented) {
                    if (node.type !== 'TagNode' || node.tag !== 'form') {
                        node = node.parent;
                        continue;
                    }
                    const handler = node.eventsMap.get('Submit');

                    if (handler) handler(event);
                    node = node.parent;
                }
            }
        }
    ],
    [
        'Change',
        {
            nativeEvent: 'change',
            handler(event) {
                let node = event.target._ref;

                if (node.tag !== 'input') {
                    throw new TypeError(`${node.tag} doesn't support onChange event`)
                }

                const handler = node.eventsMap.get('Change');
                if (handler) handler(event);
            }
        }
    ],
]);

const getSetDiff = (setA, setB) => {
    const result = new Set(setA);

    setB.forEach(elem => {
        result.delete(elem);
    })
    return result;
}

export const refreshEvents = (elem, oldEventSet, newEventSet) => {
    getSetDiff(oldEventSet, newEventSet).forEach(event => {
        const {nativeEvent, handler} = eventHandlingMap.get(event);
        elem.removeEventListener(nativeEvent, handler);
    })

    getSetDiff(newEventSet, oldEventSet).forEach(event => {
        const {nativeEvent, handler} = eventHandlingMap.get(event);
        elem.addEventListener(nativeEvent, handler);
    })
}
import {traverseTree} from "./traverser.js";

const renderVisitor = {
    TagNode: {
        onEnter: (node, parent) => {
            const elem = node.ref ?? document.createElement(node.tag);

            node.attrs.forEach(({key, value}) => {
                elem.setAttribute(key, value);
            })

            node.events.forEach(e => {
                elem.addEventListener(e.eventName, e.handler);
            })

            parent.ref.appendChild(elem)
            node.ref = elem;
        }
    },
    TextNode: {
        onEnter: (node, parent) => {
            parent.ref.innerText = node.value;
        }
    },
    CustomNode: {
        onEnter: (node, parent) => {
            node.ref = parent.ref;
        }
    },
}

const nodeComparator = {
    RootNode: {
        compare: (a, b) => true
    },
    TagNode: {
        compare: (a, b) => {
            if (a.name !== b.name)
                return false;

            if (a.attrs.length !== b.attrs.length)
                return false

            const aSortedAttrs = [...a.attrs].sort((x, y) => x.key - y.key);
            const bSortedAttrs = [...b.attrs].sort((x, y) => x.key - y.key);

            for (let i = 0; i < aSortedAttrs.length; i++) {
                if (aSortedAttrs[i].key !== bSortedAttrs[i].key ||
                    aSortedAttrs[i].value !== bSortedAttrs[i].value) {
                    return false;
                }
            }
            return true;
        }
    },
    TextNode: {
        compare: (a, b) => {
            return a.value === b.value;
        }
    },
    CustomNode: {
        compare: (a, b) => {
            return a.name === b.name;
        }
    },
}

export const renderTree = (ast, parent) => traverseTree(ast, parent, renderVisitor);

export const renderDiff = (oldTree, newTree) => {
    let oldPtr = oldTree;
    let newPtr = newTree;

    let isRespect = false;

    const compareNodes = (a, b) => a.type === b.type && nodeComparator[a.type].compare(a, b);

    const letUp = () => {
        oldPtr = oldPtr.parent;
        newPtr = newPtr.parent;
        isRespect = true;
    }

    const goToNextChild = () => {
        if (oldPtr._nodesLeft === 0 && newPtr._nodesLeft > 0) {
            oldPtr.children = [...newPtr.children];

            oldPtr.children.forEach(c => {
                c.parent = oldPtr;
                renderTree(c, oldPtr);
            })

            newPtr._nodesLeft = 0;
            letUp();

        } else if (oldPtr._nodesLeft > 0 && newPtr._nodesLeft === 0) {
            oldPtr.children.forEach(c => {
                c.ref?.remove();
            })
            oldPtr.children = [];
            oldPtr._nodesLeft = 0;
            letUp();
        } else {
            oldPtr = oldPtr.children.at(-oldPtr._nodesLeft);
            newPtr = newPtr.children.at(-newPtr._nodesLeft);
        }
    }

    const syncEvents = (oldPtr, newPtr) => {
        // if (!oldPtr.events) {
        //     return;
        // }
        //
        // oldPtr.events.forEach(({eventName, handler}) => {
        //     oldPtr.ref.removeEventListener(eventName, handler);
        // })
        //
        // oldPtr.events = [...newPtr.events];
        //
        // oldPtr.events.forEach(({eventName, handler}) => {
        //     oldPtr.ref.addEventListener(eventName, handler);
        // })
    }

    const rerenderChildren = () => {
        const firstWithChanges = oldPtr.children.length - oldPtr._nodesLeft;

        for (let i = firstWithChanges; i < oldPtr.children.length; i++) {
            oldPtr.children[i].ref?.remove();
        }

        // replace the nodes with changes
        const freshNodes = newPtr.children.slice(-newPtr._nodesLeft);
        oldPtr.children.splice(-oldPtr._nodesLeft, Infinity, ...freshNodes);

        // render the nodes with changes
        for (let i = firstWithChanges; i < oldPtr.children.length; i++) {
            oldPtr.children[i].parent = oldPtr;
            renderTree(oldPtr.children[i], oldPtr);
        }
    }

    while (oldPtr) {
        if (isRespect) {
            oldPtr._nodesLeft--;
            newPtr._nodesLeft--;

            if (oldPtr._nodesLeft === 0 && newPtr._nodesLeft === 0) {
                letUp();
                continue;
            }
            goToNextChild();
            isRespect = false;
        }

        if (!compareNodes(oldPtr, newPtr)) {
            oldPtr = oldPtr.parent;
            newPtr = newPtr.parent;

            rerenderChildren();

            oldPtr._nodesLeft = 0;
            newPtr._nodesLeft = 0;

            letUp();
            continue;
        }

        syncEvents(oldPtr, newPtr);

        if (!oldPtr.children ||
            oldPtr.children.length === 0 && newPtr.children.length === 0) {
            letUp();
            continue;
        }

        oldPtr._nodesLeft = oldPtr.children.length;
        newPtr._nodesLeft = newPtr.children.length;
        goToNextChild();
    }
}
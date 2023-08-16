import { random } from "lodash";
import React from "react";

export default function useInViewPort(callback){
    const elementToMonitor = React.useRef();

    function callbackFn([entry]){
        console.log("callback called", entry.isIntersecting);
        if(entry.isIntersecting){
            callback();
        }
    }

    React.useEffect(() => {
        const currentElement = elementToMonitor.current
        if (currentElement){
            const observer = new IntersectionObserver(callbackFn, {
                root: null,
                margin: '0px',
                threshold: 1.0,
            });
            observer.observe(currentElement);
    
            return () => {
                observer.unobserve(currentElement);
            }
        }
    },);

    return elementToMonitor;
}
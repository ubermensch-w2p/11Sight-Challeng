/*Provides a global search history context*/
import React from "react";
import SearchHistory from "./SearchHistory";

const HistoryContext = React.createContext();

function HistoryProvider({children}){
    const refHistory = React.useRef(new SearchHistory());
    
    return (
        <HistoryContext.Provider value={refHistory.current}>
            {children}
        </HistoryContext.Provider>
    );
}

function useHistory(){
    return React.useContext(HistoryContext);
}

export {HistoryProvider, useHistory};
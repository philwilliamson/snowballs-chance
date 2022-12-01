import React from "react";

const OverlayMessage = ({
    headerString,
    promptString = "",
    showPrompt = true,
    messageClassNames,
    children

}: {
    headerString: string;
    promptString?: string;
    showPrompt?: boolean;
    messageClassNames: string;
    children?: React.ReactNode; 
}) => {
    return (
        <div className={messageClassNames}>
            <h1>{headerString}</h1>
            { children }
            <div className="promptContainer">
                { showPrompt ? 
                    <h3>{promptString}</h3>
                :   <img src="./snowball.png"/>
                
                }
            </div>
        </div>
    )
}

export default OverlayMessage;
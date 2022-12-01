const OverlayMessage = ({
    headerString,
    promptString = "",
    showPrompt = true,
    messageClassNames

}: {
    headerString: string;
    promptString?: string;
    showPrompt?: boolean;
    messageClassNames: string;
}) => {
    return (
        <div className={messageClassNames}>
            <h1>{headerString}</h1>
            <h3>{ showPrompt && promptString}</h3>
        </div>
    )
}

export default OverlayMessage;
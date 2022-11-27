const OverlayMessage = ({
    headerString,
    subHeaderString = "",
    messageClassNames

}: {
    headerString: string;
    subHeaderString?: string;
    messageClassNames: string;
}) => {
    return (
        <div className={messageClassNames}>
            <h1>{headerString}</h1>
            <h3>{subHeaderString}</h3>
        </div>
    )
}

export default OverlayMessage;
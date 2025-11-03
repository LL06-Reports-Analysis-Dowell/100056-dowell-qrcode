export function validateScans(req, res, next) {
    const { scans } = req.body;

    if (!Array.isArray(scans)) {
        return res.status(400).json({ error: "scans must be an array" });
    }

    for (const scan of scans) {
        if (!scan.tokenId || !scan.data) {
            return res.status(400).json({ error: "invalid scan format" });
        }
    }

    next(); // all good, go to controller
}

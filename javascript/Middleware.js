function authorizeRole(role) {
    return (req, res, next) => {
        const userCookie = req.cookies.user;

        if (!userCookie) {
            return res.status(401).send('Необхідно увійти.');
        }

        let user;
        try {
            user = JSON.parse(userCookie);
        } catch (error) {
            return res.status(400).send('Некоректна кука користувача.');
        }

        if (user.role !== role) {
            return res.status(403).send('Недостатньо прав для доступу.');
        }

        next();
    };
}
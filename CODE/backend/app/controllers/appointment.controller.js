const pool = require("../libs/mysql2");

module.exports.getUserApps = async (req, res, next) => {
	const user_id = req.userId;

	const [rows] = await pool.query(
		"SELECT * FROM appointments WHERE user_id=? ORDER BY date ASC",
		[user_id]
	);

	res.send(rows);
};

module.exports.addUserApp = async (req, res, next) => {
	const { date, type } = req.body;
	const user_id = req.userId;

	const q = `
		INSERT INTO appointments(date, type, user_id)
		VALUES (?, ?, ?)
	`;

	const [rows] = await pool.query(q, [date, type, user_id]);

	res.send(rows);
};

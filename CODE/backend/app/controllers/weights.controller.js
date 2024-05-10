const pool = require("../libs/mysql2");

module.exports.getUserWeights = async (req, res, next) => {
	const user_id = req.userId;

	const [rows] = await pool.query(
		"SELECT * FROM weights WHERE user_id=? ORDER BY date ASC",
		[user_id]
	);

	res.send(rows);
};

module.exports.addUserWeights = async (req, res, next) => {
	const { date, weight } = req.body;
	const user_id = req.userId;

	const q = `
		INSERT INTO weights(date, weight_kg, user_id)
		VALUES (?, ?, ?)
	`;

	const [rows] = await pool.query(q, [date, weight, user_id]);

	res.send(rows);
};

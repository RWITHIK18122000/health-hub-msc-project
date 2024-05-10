const pool = require("../libs/mysql2");

module.exports.addMedications = async (req, res, next) => {
	const { med_name, dosage, freq, schedules } = req.body;

	const user_id = req.userId;

	let q = `
		INSERT INTO medications(med_name, dosage, freq, schedules, user_id) 
		VALUES (?, ?, ?, ?, ?)
	`;

	await pool.query(q, [med_name, dosage, freq, schedules, user_id]);

	q = `
		SELECT * FROM medications WHERE user_id=?
	`;

	const [rows] = await pool.query(q, [user_id]);

	res.send(rows);
};

module.exports.getUserMedications = async (req, res, next) => {
	const user_id = req.userId;

	const q = `
		SELECT * FROM medications WHERE user_id=?
	`;

	const [rows] = await pool.query(q, [user_id]);

	res.send(rows);
};

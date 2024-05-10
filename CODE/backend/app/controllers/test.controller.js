const pool = require("../libs/mysql2");

module.exports.test = async (req, res, next) => {
	const [rows] = await pool.query("SELECT * FROM categories");

	res.send({ message: "Its working!!", data: rows });
};

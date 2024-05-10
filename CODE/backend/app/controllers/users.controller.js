const bcrypt = require("bcrypt");
const { v4: uuid4 } = require("uuid");

const pool = require("../libs/mysql2");
const jwt = require("../libs/jwt");
const nodemailer = require("../libs/nodemailer");

module.exports.register = async (req, res, next) => {
	const { fullname, email, password, age, gender, medical_his, number } =
		req.body;

	// Trim whitespace from input fields
	const trimmedFullname = fullname.trim();
	const trimmedEmail = email.trim();
	const trimmedPassword = password.trim();
	const trimmedMedicalHis = medical_his.trim();
	const intAge = parseInt(age.trim());
	const intGender = parseInt(gender.trim());
	const intNumber = number.trim();

	let q = `
			SELECT * FROM users WHERE email=?
	`;

	let [rows] = await pool.query(q, [trimmedEmail]);

	if (rows.length > 0) {
		res.status(400).send({ message: "User with this email already exists!" });
		return;
	}

	q = `
			SELECT * FROM users WHERE number=?
	`;

	[rows] = await pool.query(q, [intNumber]);

	if (rows.length > 0) {
		res
			.status(400)
			.send({ message: "User with this phone number already exists!" });
		return;
	}

	const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

	await pool.query(
		"INSERT INTO users (fullname, email, number, password, age, gender, medical_his) VALUES (?, ?, ?, ?, ?, ?, ?)",
		[
			trimmedFullname,
			trimmedEmail,
			intNumber,
			hashedPassword,
			intAge,
			intGender,
			trimmedMedicalHis,
		]
	);

	res.send({ message: "registered successfully!!" });
};

module.exports.login = async (req, res, next) => {
	const { email = "", password = "" } = req.body;

	if (!email || !password) {
		res.status(400).send({ message: "Email and Password are required!" });
		return;
	}

	try {
		const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
			email,
		]);
		if (rows.length === 0) {
			res.status(400).send({ message: "Invalid email id or password!" });
			return;
		}

		const user = rows[0];

		// Compare the passwords
		const isPasswordValid = await bcrypt.compare(
			password.trim(),
			user.password
		);

		if (!isPasswordValid) {
			res.status(400).send({ message: "Invalid email id or password!" });
			return;
		}

		const token = jwt.signToken(user.id);

		res.send({ token, ...user, password: null });
	} catch (error) {
		console.error("Login failed:", error);
		return res.status(500).send({
			message: "An unexpected error occurred. Please try again later",
		});
	}
};

module.exports.requestForgetPassword = async (req, res, next) => {
	let { email } = req.body;

	email = email.trim();

	const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
		email,
	]);

	if (rows.length === 0) {
		res.status(400).send({ message: "no user exists with this email!" });
		return;
	}

	const q = `	INSERT INTO forgot_pass_req(user_id, code) 
				VALUES (?, ?)`;

	const unique_code = uuid4();

	await pool.query(q, [rows[0].id, unique_code]);

	const link = "http://localhost:5173/change-password/" + unique_code;

	await nodemailer.sendEmail(
		email,
		"Forgot Password Request",
		"Please visit below link to change your password \n " + link
	);

	res.send({ message: "Forgot Password email sent!" });
};

module.exports.changePassoword = async (req, res, next) => {
	const { unique_code, password } = req.body;
	const trimmedPassword = password.trim();

	const [rows] = await pool.query(
		"SELECT * FROM forgot_pass_req WHERE code = ?",
		[unique_code.trim()]
	);

	if (rows.length === 0) {
		res.status(400).send({ message: "invalid request!" });
		return;
	}

	const user_id = rows[0].user_id;
	const row_id = rows[0].id;

	const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

	let q = `
			UPDATE users
			SET	password=?
			WHERE id=?
	`;
	await pool.query(q, [hashedPassword, user_id]);

	q = `
			delete from forgot_pass_req WHERE id=?
	`;
	await pool.query(q, [row_id]);

	res.send({ message: "Password changed successfully!!" });
};

module.exports.loginWithOtp = async (req, res, next) => {
	const { number } = req.body;

	if (!number) {
		res.status(400).send({ message: "number is required!" });
		return;
	}

	try {
		let q = `
			SELECT * FROM users WHERE number=?
	`;

		let [rows] = await pool.query(q, [number]);

		if (rows.length === 0) {
			res
				.status(400)
				.send({ message: "User with this number does not exists!" });
			return;
		}

		const user = rows[0];

		const token = jwt.signToken(user.id);

		res.send({ token, ...user, password: null });
	} catch (error) {
		console.error("Login failed:", error);
		return res.status(500).send({
			message: "An unexpected error occurred. Please try again later",
		});
	}
};

module.exports.checkUser = async (req, res, next) => {
	const { number } = req.body;

	let q = `
			SELECT * FROM users WHERE number=?
	`;

	let [rows] = await pool.query(q, [number]);

	if (rows.length === 0) {
		res.status(400).send({ message: "User with this number does not exist!" });
		return;
	}

	res.send({ message: "user exists!" });
};

import Router = require("@koa/router");
import { App, Errors } from "../../main";
import SecureHasher from "../../utils/secure-hasher";
import parseBody from "../parse-body";

const sessionRouter = new Router();

async function validateAuthData(app: App, username: string, password: string) {
	const [user] = await app.Datastore.find("users", {
		"username.safe": username,
	});

	if (!user) {
		throw new Errors.InvalidCredentials("Incorrect username!");
	}

	const is_valid = await SecureHasher.matches(password, user.password);
	if (!is_valid) {
		throw new Errors.InvalidCredentials("Incorrect password!");
	}

	return user;
}

sessionRouter.post("/", parseBody(), async (ctx) => {
	const username = ctx.request.body.username;
	const password = ctx.request.body.password;
	if (!username) {
		throw new Errors.InvalidCredentials("Missing username!");
	}
	if (!password) {
		throw new Errors.InvalidCredentials("Missing password!");
	}

	const user = await validateAuthData(ctx.$app, username, password);

	const session = ctx.$app.collections.sessions.make({
		user: user.id,
		"session-id": null,
	});
	await session.save(new ctx.$app.SuperContext());
	const session_id = session.get("session-id");
	ctx.body = { status: "logged in!" };
	ctx.status = 201;
	const config = ctx.$app.ConfigManager.get("www-server");
	const cookie_name = config["session-cookie-name"];
	ctx.cookies.set(cookie_name, session_id, {
		maxAge: 1000 * 60 * 60 * 24 * 7,
		secure: ctx.request.protocol === "https",
		overwrite: true,
	});
});

export default sessionRouter;

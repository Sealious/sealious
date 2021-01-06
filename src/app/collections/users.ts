import Router from "@koa/router";
import { Collection, App, FieldTypes, Policies } from "../../main";
import { BadContext } from "../../response/errors";

export default class Users extends Collection {
	fields = {
		username: new FieldTypes.Username(),
		email: new FieldTypes.Email(),
		password: new FieldTypes.Password(),
		roles: new FieldTypes.ReverseSingleReference({
			referencing_collection: "user-roles",
			referencing_field: "user",
		}),
	};

	policies = {
		show: new Policies.Themselves(),
	};

	async init(app: App, name: string) {
		await super.init(app, name);
		app.on("started", async () => {
			const users = await app.collections.users
				.suList()
				.filter({ email: app.manifest.admin_email })
				.fetch();
			if (users.empty) {
				app.Logger.warn(
					"ADMIN",
					`Creating an admin account for ${app.manifest.admin_email}`
				);
				await app.collections["registration-intents"].suCreate({
					email: app.manifest.admin_email,
					role: "admin",
				});
			}
		});
	}

	getRouter() {
		const router = new Router();
		router.get("/me", async (ctx) => {
			if (typeof ctx.$context.user_id !== "string") {
				throw new BadContext("You're not logged in!");
			}
			const user = this.list(ctx.$context)
				.ids([ctx.$context.user_id])
				.setParams(ctx.query);
			ctx.body = (await user.fetch()).serialize();
		});

		const super_router = super.getRouter();

		router.use(super_router.routes(), super_router.allowedMethods());

		return router;
	}
}

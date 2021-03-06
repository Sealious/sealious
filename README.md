[![Sealious Logo](./src/assets/logo.png)](http://sealious.github.io/)

# Sealious

Sealious is a declarative node.js framework. It creates a full-featured REST-ful
API (with user and session management) based on a declarative description of the
database schema and policies.

## Example

Install sealious with `npm install --save sealious`. Then, in your index.ts:

```
lang=typescript
import { resolve } from "path";
import Sealious, { App, Collection, FieldTypes, Policies } from "sealious";
const locreq = _locreq(__dirname);

const app = new (class extends App {
    config = {
        datastore_mongo: {
            host: "localhost",
            port: 20723,
            db_name: "sealious-playground",
        },
        upload_path: locreq.resolve("uploaded_files"),
        email: {
            from_address: "sealious-playground@example.com",
            from_name: "Sealious playground app",
        },
        "www-server": {
            port: 8080, //listen on this port
        },
    };
    manifest = {
        name: "My ToDo list",
        logo: resolve(__dirname, "../assets/logo.png"),
        version: "0.0.1",
        default_language: "en",
        base_url: "localhost:8080",
        admin_email: "admin@example.com",
        colors: {
            primary: "#5294a1",
        },
    };
    collections = {
        ...App.BaseCollections,
        tasks: new (class extends Collection {
            fields = {
                title: new FieldTypes.Text(),
                done: new FieldTypes.Boolean(),
            };
            defaultPolicy = new Policies.Public();
        })(),
    };
})();

app.start();
```

Assuming you have the mongo database running, that's it! The above script
creates a fully functional REST API with field validation, error messages, etc.
Try sending as POST message to `http://localhost:8080/api/v1/collections/tasks`
to see the API in action. You can learn more about the endpoints created by
Sealious for each collection [in ./endpoints.remarkup doc
file](https://hub.sealcode.org/source/sealious/browse/dev/endpoints.remarkup).

The app created by the above code also has some handy ORM-style methods to access and modify items within the collection:

```
lang=typescript
import {Context} from "sealious";

const tasks = app.collections.tasks.list(new Context(app)).fetch()
```

To learn more about the ORM methods, see [./orm.remarkup doc file](https://hub.sealcode.org/source/sealious/browse/dev/orm.remarkup).

## Learning Resources

### Examples

It's best to learn by example. Here are some applications written with the
current version of Sealious:

-   [Sealious Playground](https://hub.sealcode.org/diffusion/PLAY/) - simple
    TODO app written in Sealious and Hotwire. Contains docker setup for mongo,
    linting, typescript etc. Good starting point for a new app.

### References

-   [Creating collections](https://hub.sealcode.org/source/sealious/browse/dev/src/chip-types/creating-collections.remarkup)
-   [List of all endpoints automatically created by
    Sealious](https://hub.sealcode.org/source/sealious/browse/dev/endpoints.remarkup)
-   [ORM style accessors to database](https://hub.sealcode.org/source/sealious/browse/dev/orm.remarkup)
-   [Theory and practice behind Context](https://hub.sealcode.org/source/sealious/browse/dev/context.remarkup)
-   [List of Built-in field
    types](https://hub.sealcode.org/source/sealious/browse/dev/src/app/base-chips/field-types/field-types.remarkup)
-   [Creating custom
    field-types](https://hub.sealcode.org/source/sealious/browse/dev/src/app/base-chips/field-types/creating-field-types.remarkup)
-   [List of build-in Policies](https://hub.sealcode.org/source/sealious/browse/dev/src/app/policy-types/policy-types.remarkup)
-   [Creating custom Policy
    types](https://hub.sealcode.org/source/sealious/browse/dev/src/app/policy-types/creating-policy-types.remarkup)
-   [How User Roles work in Sealious](https://hub.sealcode.org/source/sealious/browse/dev/roles.remarkup)

### FAQ

#### How do I add a custom route?

Sealious uses `koa` and [@koa/router](https://github.com/koajs/router) to handle HTTP. To add a simple static route:

```
lang=typescript
app.HTTPServer.router.get("/", async (ctx) => {
    ctx.body = html(/* HTML */ `
        <body>
            <h1>Hello, world!</h1>
        </body>
    `);
});
```

If you need to perform some user-specific tasks, or need to extract the context in order to call the database, use the `extractContext` Middleware:

```
lang=typescript
import {Middlewares} from "sealious";

app.HTTPServer.router.get("/", Middlewares.extractContext(), async (ctx) => {
    const {items: tasks} = await app.collections.tasks.list(ctx.$context).fetch();
    ctx.body = html(/* HTML */ `
        <body>
            <h1>My To do list</h1>
            {tasks.map(task=>task.get("title")).join("")}
        </body>
    `);
});
```

#### How do I serve static files?

```
lang=typescript
app.HTTPServer.addStaticRoute("/", locreq.resolve("public"));
```

#### How do I set up SMTP?

When mailer isn't specified, Sealious log messages to `stdout` instead of
sending them via email. To make it use an SMTP connection, add the following to
the app definition:

```
lang=typescript
import { SMTPMailer } from "sealious";

// in app definition:

const app = new (class extends App {
    config = {
        /* ... */
    };
    mailer = new SMTPMailer({
        host: "localhost",
        port: 1025,
        user: "any",
        password: "any",
    });
})();
```

#### How do I change a policy for a built-in collection?

```
lang=typescript
const app = new (class extends App {
    config = {
        /* ... */
    };
    manifest = {
        /* ... */
    };
    collections = {
        ...App.BaseCollections,
        users: App.BaseCollections.users.setPolicy(
            "create",
            new Policies.Public()
        ),
    };
})();
```

#### How do I add a field to a built-in collection?

```
lang=typescript
import {Collections} from "sealious";

const app = new (class extends App {
    config = {
    /* ... */
    };
    manifest = {
    /* ... */
    };
    collections = {
        ...App.BaseCollections,

        users: new (class users extends Collections.users {
            fields = {
                ...App.BaseCollections.users.fields,
                description: new FieldTypes.Text(),
            };
        })(),
    };
})();
```

#### How to create a custom login endpoint?

```
lang=typescript
function LoginForm(username: string = "", error_message?: string) {
    return /* HTML */ `
        <form method="POST" action="/login">
            ${error_message ? `<div>${error_message}</div>` : ""}
            <label for="username">
                Username:
                <input
                    id="username"
                    name="username"
                    type="text"
                    value="${username}"
                    required
                />
            </label>
            <label for="password"
                >Password:
                <input
                    id="password"
                    name="password"
                    type="password"
                    value="${username}"
                    required
            /></label>
            <input type="submit" value="log in" />
        </form>
    `;
}

const router = app.HTTPServer.router;

router.get("/login", async (ctx) => {
    ctx.body = LoginForm();
});

router.post("/login", Middlewares.parseBody(), async (ctx) => {
    try {
        const session_id = await ctx.$app.collections.sessions.login(
            ctx.$body.username as string,
            ctx.$body.password as string
        );
        ctx.cookies.set("sealious-session", session_id, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            secure: ctx.request.protocol === "https",
            overwrite: true,
        });
        ctx.redirect("/user");
        ctx.status = 303; // more standards- and hotwire-friendly
    } catch (e) {
        ctx.body = LoginForm(ctx.$body.username as string, e.message);
    }
});
```

#### How to set up a default value to a field?

It's possible, but currently not pretty. This will be fixed in the future.

```
lang=typescript
const tasks = new (class extends Collection {
	fields = {
		title: new FieldTypes.Text(),
		done: new (class extends FieldTypes.Boolean {
			hasDefaultValue = () => true;
			async getDefaultValue() {
				return false;
			}
		})(),
	};
	defaultPolicy = new Policies.Public();
})();
```

#### How to sort by modification/creation time?

```
lang=typescript
app.collections.entries
	.suList()
	.sort({ "_metadata.modified_at": "desc" }) // or: _metadata.created_at
	.fetch();
```

### How to add custom validation to a collection?

```
lang=typescript
export class CollectionWithComplexValidation extends Collection {
  fields = {
    color: new FieldTypes.Color(),
  };

  async init(app: App, name: string): Promise<void> {
    await super.init(app, name);
    this.on("before:create", async ([context, item]) => {
      // item.body.raw_input - contains all fields passed during creation
      if (project.body.raw_input.name.includes("green")) {
        throw new ValidationError("Green is not a creative color");
      }
    });
    this.on("before:edit", async ([context, project]) => {
      // item.body.raw_input - contains all fields passed to PUT or PATCH. If empty then it means that the user did not change the value
      if (project.body.raw_input.name.includes("green")) {
        throw new ValidationError("Green is not a creative color");
      }
    });
  }

  defaultPolicy = new Policies.Public();
}
```

## Technical docs

For technical reference, see
[sealious.sealcode.org/docs](https://sealious.sealcode.org/docs)

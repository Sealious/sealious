import assert from "assert";
import FileField from "../../app/base-chips/field-types/file";
import { Collection } from "../../main";
import asyncRequest from "../../test_utils/async-request";
import { withRunningApp } from "../../test_utils/with-test-app";

describe("uploaded_files", () => {
	it("has a test", () => {
		return withRunningApp(
			(test_app_type) => {
				return class extends test_app_type {
					collections = {
						...test_app_type.BaseCollections,
						with_file: new (class extends Collection {
							fields = {
								file: new FileField(),
							};
						})(),
					};
				};
			},
			async ({ port, rest_api }) => {
				const form_data =
					'------------------------------4ebf00fbcf09\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nI AM A TEST\r\n\r\n\r\n------------------------------4ebf00fbcf09--';
				const options = {
					hostname: "localhost",
					port: port,
					path: "/api/v1/collections/with_file",
					method: "POST",
					headers: {
						"Content-Type":
							"multipart/form-data; boundary=----------------------------4ebf00fbcf09",
					},
				};
				const data = (await asyncRequest(options, form_data)) as Record<
					"file" | "id",
					string
				>;
				const url_regex = new RegExp(
					/\/api\/v1\/uploaded-files\/\S*\/test.txt/
				);
				assert.match(data.file, url_regex);
				const response = await rest_api.get(data.file);
				assert.strictEqual(response, "I AM A TEST\r\n\r\n");
			}
		);
	});
});

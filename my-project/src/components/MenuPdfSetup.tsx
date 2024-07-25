"use client";

// import { SingleImageDropzone } from "@/components/edgestore/SingleImageUpload";
import { useEdgeStore } from "@/utils/edgestore";
import { zodResolver} from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	MultiFileDropzone,
	type FileState,
} from "@/components/MultiFileDropzone";
import Image from "next/image";
// import {
//   addPdfMenuWithPages,
//   deleteAllMenus,
//   getMenuIdUsingEntityId,
// } from "@/server/actions/menu.actions";
import { Preahvihear } from "next/font/google";

const formSchema = z.object({
	pdfMenuName: z
		.string()
		.min(2, { message: "you missed the name of the pdf menu" }),
	files: z
		.array(
			z.object({
				filename: z
					.string()
					.min(1, { message: "you missed the name of the file" }),
				url: z
					.string()
					.min(1, { message: "you missed the url of the file" }),
				fileOrder: z
					.number()
					.min(1, { message: "you missed the order of the file" }),
			})
		)
		.min(1),
});
type FormValues = z.infer<typeof formSchema>;

export type FileType = {
	key: string;
	url: string;
	fileName: string;
	fileOrder: number;
};
export type DbFileType = Omit<FileType, "key">;
export function MenuPdfSetup({ entityId }: { entityId: string }) {
	const [fileStates, setFileStates] = useState<FileState[]>([]);
	const [values, setValues] = useState<FileType[]>([]);
	const [dbValues, setDbValues] = useState<DbFileType[]>([]);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			pdfMenuName: "first pdf menu",
			files: [],
			// fileOrder: 1,
		},
	});
	const { edgestore } = useEdgeStore();

	function updateFileProgress(key: string, progress: FileState["progress"]) {
		setFileStates((fileStates) => {
			const newFileStates = structuredClone(fileStates);
			const fileState = newFileStates.find(
				(fileState) => fileState.key === key
			);
			if (fileState) {
				fileState.progress = progress;
			}
			return newFileStates;
		});
	}

	const handleDeleteImage = (key: string) => {
		const newValue = [...values];
		const arrayWithRemovedValue = newValue.filter(
			(element) => element.key !== key
		);
		const newFiles = [...fileStates];
		const arrayWithRemovedFile = newFiles.filter(
			(element) => element.key !== key
		);
		console.log(
			"newValue",
			newValue,
			"deletedValue",
			arrayWithRemovedValue
		);
		setFileStates(arrayWithRemovedFile);
		setValues(arrayWithRemovedValue);
		console.log("values", values);
	};

	const handleNameChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		index: number
	) => {
		const newValue = [...values];
		newValue[index].fileName = e.target.value;
		setValues(newValue);
		console.log("values", values);
	};
	const handleOrderChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		index: number
	) => {
		const newValue = [...values];
		newValue[index].fileOrder = Number(e.target.value);
		setValues(newValue);
		console.log("values", values);
	};

	async function onSubmit(data: FormValues) {
		console.log("data", data);
		const menuName = data.pdfMenuName;
		console.log("menuName", menuName);

		if (data.files) {
			console.log("data", data);
			await Promise.all(
				fileStates.map(async (addedFileState) => {
					try {
						const res = await edgestore.publicFiles.upload({
							file: addedFileState.file,
							onProgressChange: async (progress) => {
								updateFileProgress(
									addedFileState.key,
									progress
								);
								if (progress === 100) {
									// wait 1 second to set it to complete
									// so that the user can see the progress bar
									await new Promise((resolve) =>
										setTimeout(resolve, 1000)
									);
									updateFileProgress(
										addedFileState.key,
										"COMPLETE"
									);
								}
							},
						});

						console.log("res", res);
						let newValues = [...values];
						const finalValues = newValues.map((value) =>
							value.key === addedFileState.key
								? { ...value, url: res.url }
								: value
						);
						console.log("values", finalValues);
						setValues(finalValues);
						const finalDbValues: DbFileType[] = finalValues.map(
							(obj: FileType) => ({
								url: obj.url,
								fileName: obj.fileName,
								fileOrder: obj.fileOrder,
							})
						);
						setDbValues(finalDbValues);
					} catch (err) {
						updateFileProgress(addedFileState.key, "ERROR");
					}
				})
			);
		}
		// const getMenuUsingEntityId = await getMenuIdUsingEntityId(entityId);
		// console.log("menuId", getMenuUsingEntityId);
		// const addedPdfPages = await addPdfMenuWithPages({
		// menuId: getMenuUsingEntityId._id,
		// pdfMenuName: menuName,
		// pdfMenuFiles: dbValues,
		// });
		// console.log("addedPdfPages", addedPdfPages);
		// if (addedPdfPages) {
		// form.reset();
		const addedPdfPages = { pdfMenuFiles: "response from the database " };
		return addedPdfPages.pdfMenuFiles;
		// } else {
		// return null;
		// }
	}

	return (
		<>
			<div className=" ">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-8"
					>
						<div>
							<FormField
								control={form.control}
								name="pdfMenuName"
								render={({ field }) => (
									<FormItem>
										{/* <FormLabel>Username</FormLabel> */}
										<FormControl>
											<Input
												placeholder="Name Of Menu Here"
												type="text"
												{...field}
												name={field.name}
												value={field.value}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormDescription>
											This is your pdf Menu Name{" "}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="files"
								render={({ field }) => (
									<FormItem>
										{/* <FormLabel>pdf Files</FormLabel> */}
										<FormControl>
											{/* here is the multi image/file  uploader */}
											<MultiFileDropzone
												handleDeleteImage={
													handleDeleteImage
												}
												values={fileStates}
												dropzoneOptions={{
													maxFiles: 10,
													maxSize: 1024 * 1024 * 1, // 1 MB
												}}
												onFilesAdded={async (
													addeFiles
												) => {
													setFileStates([
														...fileStates,
														...addeFiles,
													]);

													const newValues = [
														...fileStates,
													];
													setValues([
														...newValues.map(
															(file) => ({
																key: file.key,
																fileName:
																	file.file
																		.name,
																url: URL.createObjectURL(
																	file.file
																),
																fileOrder: 1,
															})
														),
													]);
												}}
												// setNewFiles={setNewFiles}
												// newFiles={newFiles }
												finalFormValues={values}
												onFieldChange={field.onChange}
											/>
										</FormControl>
										{/* <FormMessage /> */}
									</FormItem>
								)}
							/>
						</div>
					 <div className="w-[80vw] pt-2">
              {values?.map(
                (value, index) => (
                  // value.url != "" && (
                  <div className="flex gap-2 py-2">
                    <div className="w-25 object-contain">
                      <img
                        className="h-96 w-48 rounded-md object-cover"
                        src={value.url}
                        alt={typeof value === "string" ? value : value.fileName}
                      />
                    </div>
                    <div>
                      <Input
                        key={value.key}
                        name="fileName"
                        type="text"
                        alt={`Change name input for ${value.fileName}`}
                        value={value.fileName} // Ensure the input reflects the current fileName
                        onChange={(e) => handleNameChange(e, index)}
                      />
                      undefined
                      <Input
                        key={value.key}
                        name="fileName"
                        type="text"
                        alt={`Change name input for ${value.fileName}`}
                        value={value.fileOrder} // Ensure the input reflects the current fileName
                        onChange={(e) => handleOrderChange(e, index)}
                      />
                    </div>
                  </div>
                ),
                // ),
              )}
            </div> 

						<Button
							type="submit"
							className="w-full hover:bg-secondary"
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting
								? "Submitting..."
								: "Submit"}
						</Button>
					</form>
				</Form>
			</div>
			<section></section>
		</>
	);
}

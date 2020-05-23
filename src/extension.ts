import * as vscode from 'vscode';
import * as child_process from 'child_process';

async function runDotNetCommand(workspaceFolder: vscode.WorkspaceFolder, parameters: string[]) {
	let spawnOptions = { cwd: workspaceFolder!.uri.path };
	let dotnet = child_process.spawn("dotnet", parameters, spawnOptions);

	let dotnet_output = vscode.window.createOutputChannel("DotNet Project References");

	dotnet.stderr.on("data", (data) => {
		dotnet_output.show();
		dotnet_output.appendLine(data.toString());
	});

	dotnet.on("close", (code) => {
		if (code !== 0) {
			dotnet_output.show();
			dotnet_output.appendLine('dotnet exited with code ' + code);
		}
	});
}

async function findDotNetFiles(workspaceFolder: vscode.WorkspaceFolder, pattern: string): Promise<string[]> {
	const filesRelativePattern = new vscode.RelativePattern(workspaceFolder!, pattern);

	var fileUris = await vscode.workspace.findFiles(filesRelativePattern, '**/obj/**');
	return fileUris.map(_ => _.path.replace(workspaceFolder!.uri.path, '.'));
}

export function activate(context: vscode.ExtensionContext) {

	console.log('"dotnet-project-references" is now active!');

	let addToSlnDisposable = vscode.commands.registerCommand('dotnet-project-references.addToSln', async (uri: vscode.Uri) => {
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
		var projectFilePaths = await findDotNetFiles(workspaceFolder!, "**/*.{csproj,vbproj,fsproj}");

		var projectFile = await vscode.window.showQuickPick(projectFilePaths);
		if (!projectFile) { return; }

		var parameters = ['sln', uri.path.replace(workspaceFolder!.uri.path, '.'), 'add', projectFile];
		await runDotNetCommand(workspaceFolder!, parameters);
	});

	let addProjectToSlnDisposable = vscode.commands.registerCommand('dotnet-project-references.addProjectToSln', async (uri: vscode.Uri) => {
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
		var slnFilePaths = await findDotNetFiles(workspaceFolder!, "**/*.{sln}");

		var slnFile = await vscode.window.showQuickPick(slnFilePaths);
		if (!slnFile) { return; }

		var parameters = ['sln', slnFile, 'add', uri.path.replace(workspaceFolder!.uri.path, '.')];
		await runDotNetCommand(workspaceFolder!, parameters);
	});

	let addProjectToProjectDisposable = vscode.commands.registerCommand('dotnet-project-references.addProjectToProject', async (uri: vscode.Uri) => {
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
		var projectFilePaths = await findDotNetFiles(workspaceFolder!, "**/*.{csproj,vbproj,fsproj}");

		var projectFile = await vscode.window.showQuickPick(projectFilePaths);
		if (!projectFile) { return; }

		var parameters = ['add', uri.path.replace(workspaceFolder!.uri.path, '.'), 'reference', projectFile];
		await runDotNetCommand(workspaceFolder!, parameters);
	});

	context.subscriptions.push(addToSlnDisposable);
	context.subscriptions.push(addProjectToProjectDisposable);
	context.subscriptions.push(addProjectToSlnDisposable);
}

export function deactivate() { }

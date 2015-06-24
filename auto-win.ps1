function runTest{
	param($testDirectory="tests\gen\*.js");
	foreach($file in Get-ChildItem $testDirectory){
		karma start $file.fullName;
	}
}

function runBot{
	param($botScript="./runbot.ps1");
	cmd /c start powershell.exe -noexit -command $botScript
}

grunt karma;
runBot;
runTest;

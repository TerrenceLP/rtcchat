on run args
  set this_browser to item 1 of args
  try
    open app this_browser
    delay 3
    quit app this_browser
  on error errorMessage number errorNumber
    #log ("Failed reopening task: " & errorMessage)
    try
      quit app this_browser
    on error errorMessage1 number errorNumber1
      #log ("Failed killing task after error: " & errorMessage1)
    end try
  end try
end run
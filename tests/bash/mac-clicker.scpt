log "Automation clicker watch initialized"
set sa_started to false
set op_started to false

repeat
  if application "Safari" is running then
    if sa_started is false then
      log "Automation clicker is watching Safari"
      set sa_started to true
    end if

    tell application "System Events" to tell process "npTemWebRTCPlugin (Safari Internet plug-in)"
      if window 1 exists then
        if exists (button "OK" of front window) then
          click (button "OK" of front window)
        end if
      end if
    end tell
  end if

  if application "Opera" is running then
    if op_started is false then
      log "Automation clicker is watching Opera"
      set op_started to true
    end if

    tell application "System Events" to tell process "Opera"
      if front window exists then
        if exists (button "Allow" of front window) then
            click (button "Allow" of front window)
        end if
        if exists (button "Continue Anyway" of front window) then
          click (button "Continue Anyway" of front window)
        end if
      end if
    end tell
  end if
  delay 1
end repeat

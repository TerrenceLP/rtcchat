repeat
  # log "Automation clicker watch initialized"

  if application "Safari" is running then
    # log "Automation clicker is watching Safari"

    #tell application "System Events" to tell process "npTemWebRTCPlugin (Safari Internet plug-in)"
     # if window 1 exists then
      #  if exists (button "OK" of front window) then
      #    click (button "OK" of front window)
      #  end if
      #end if
    #end tell
  end if

  if application "Opera" is running then
    log "Automation clicker is watching Opera"

    tell application "System Events" to tell process "Opera"
      if window "Invalid Certificate" exists then
        log "ok"
        #if exists (button "Allow" of front window) then
        #  click (button "Allow" of front window)
        #end if
        if exists (button "Continue Anyway" of window "Invalid Certificate") then
          log "yes"
          click (button "Continue Anyway" of window "Invalid Certificate")
        end if
      end if
    end tell
  end if
  delay 1
end repeat
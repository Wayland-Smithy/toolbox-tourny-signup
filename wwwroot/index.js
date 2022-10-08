$(function () {
  // setup backup color input
  $('#toolbox_color_2').val($('#toolbox_color').val());
  $('#toolbox_color').on('input', () => { $('#toolbox_color_2').val($('#toolbox_color').val()); });
  $('#toolbox_color_2').on('input', () => { $('#toolbox_color').val($('#toolbox_color_2').val()); });
  $('#editlink').focus(function () { $(this).select(); });

  // load edit if id in query
  let eStart = location.search.indexOf("?e=");
  if (eStart !== -1)
    reqTeamJSON(location.search.substring(eStart + 3));
});

function reqTeamJSON(editID) {
  $('#team').val("Loading...");
  (async () => {
    fetch(`https://api.toolbox-signup.com:8080?edit=${editID}`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }).then(async (rawResponse) => {
      if (!rawResponse)
        return;
      if (rawResponse.status !== 200) {
        $('#team').val('');
        $('#badedit').prop("hidden", false);
        return;
      }
      // success
      const content = await rawResponse.json();
      $('#team').val(content.name);
      $('#member1').val(content.roster[0]);
      $('#member2').val(content.roster[1]);
      $('#member3').val(content.roster[2]);
      $('#toolbox_color').val(content.toolbox_color);
      $('#editlink').val(location.href);
      $('button > strong').text('SUBMIT EDIT');
    }).catch(() => {
      $('#team').val('');
      $('#failhard').prop("hidden", false)
    });
  })();
}

function sendTeamJSON() {
  // form submitted
  $('#success').prop("hidden", true);
  $('#badedit').prop("hidden", true);
  $('#fail').prop("hidden", true);
  $('#failhard').prop("hidden", true);

  $('button').prop("disabled", true);
  $('button > strong').text('SUBMITTING...');
  setTimeout(() => {
    $('button').prop("disabled", false);
    $('button > strong').text(location.hash?.length > 1 ? 'SUBMIT EDIT' : 'SUBMIT');
  }, 3000);
  (async () => {
    let eStart = location.search.indexOf("?e=");
    const rawResponse = await fetch(`https://api.toolbox-signup.com:8080`, {
      method: 'POST',
      body: JSON.stringify(
        {
          name: $('#team').val(),
          roster: [$('#member1').val(), $('#member2').val() || "", $('#member3').val() || ""],
          toolbox_color: $('#toolbox_color').val(),
          outfit: {},
          edit: eStart !== -1 ? location.search.substring(eStart + 3) : null
        }
      ),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }).catch(() => {
      // something went wrong
      $('#fail').prop("hidden", false);
    });
    if (!rawResponse)
      return;
    if (rawResponse.status !== 200) {
      // something went wrong
      $('#fail').prop("hidden", false);
      return;
    }
    // success
    const content = await rawResponse.json();
    $('#editlink').val(location.origin + location.pathname + "?e=" + content.id);
    $('#lastsubmit').text(new Date().toLocaleString());
    $('#success').prop("hidden", false);
  })();
}

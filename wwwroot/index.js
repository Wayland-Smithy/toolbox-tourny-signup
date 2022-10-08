$(function () {
  // setup backup color input
  $('#toolbox_color_2').val($('#toolbox_color').val());
  $('#toolbox_color').on('input', () => { $('#toolbox_color_2').val($('#toolbox_color').val()); });
  $('#toolbox_color_2').on('input', () => { $('#toolbox_color').val($('#toolbox_color_2').val()); });

  // load edit if id in hash
  if (location.hash?.length > 1)
    reqTeamJSON();
});

function reqTeamJSON() {
  (async () => {
    const rawResponse = await fetch(`https://api.toolbox-signup.com:8080?edit=${location.hash.substring(1)}`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }).catch(() => {
      // something went wrong
      $('#badedit').prop("hidden", false);
      location.hash = "";
    });
    if (!rawResponse)
      return;
    if (rawResponse.status !== 200) {
      $('#badedit').prop("hidden", false);
      location.hash = "";
      setTimeout(() => {
        $('#badedit').prop("hidden", true);
      }, 5000);
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
  })();
}

function sendTeamJSON() {
  // form submitted
  $('#success').prop("hidden", true);
  $('#badedit').prop("hidden", true);
  $('#fail').prop("hidden", true);

  $('button').prop("disabled", true);
  $('button > strong').text('SUBMITTING...');
  setTimeout(() => {
    $('button').prop("disabled", false);
    $('button > strong').text(location.hash?.length > 1 ? 'SUBMIT EDIT' : 'SUBMIT');
  }, 3000);
  (async () => {
    const rawResponse = await fetch(`https://api.toolbox-signup.com:8080`, {
      method: 'POST',
      body: JSON.stringify(
        {
          name: $('#team').val(),
          roster: [$('#member1').val(), $('#member2').val() || "", $('#member3').val() || ""],
          toolbox_color: $('#toolbox_color').val(),
          outfit: {},
          edit: location.hash?.length > 1 ? location.hash.substring(1) : null
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
    location.hash = content.id;
    $('#editlink').val(location.href);
    $('#lastsubmit').text(new Date().toLocaleString());
    $('#success').prop("hidden", false);
  })();
}

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

function toggleCapt() {
  $('#captspan').prop("hidden", !$('#captspan').prop("hidden"));
}

function reqTeamJSON(editID) {
  $('button > strong').text("LOADING...");
  $('button').prop("disabled", true);
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
        //$('button > strong').text("SUBMIT");
        //$('button').prop("disabled", false);
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
      $('#toolbox_color_2').val(content.toolbox_color);
      $('#editlink').val(location.href);
      $('button > strong').text("SUBMIT EDIT");
      $('button').prop("disabled", false);
    }).catch(() => {
      $('button > strong').text("SUBMIT");
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
  (async () => {
    let eStart = $('#editlink').val().indexOf("?e=");
    const rawResponse = await fetch(`https://api.toolbox-signup.com:8080`, {
      method: 'POST',
      body: JSON.stringify(
        {
          name: $('#team').val(),
          roster: [$('#member1').val(), $('#member2').val() || "", $('#member3').val() || ""],
          toolbox_color: $('#toolbox_color').val(),
          outfit: {},
          edit: eStart !== -1 ? $('#editlink').val().substring(eStart + 3) : null
        }
      ),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }).catch(() => {
      // something went wrong
      $('#fail').prop("hidden", false);
      $('button').prop("disabled", false);
      $('button > strong').text($('#editlink').val().indexOf("?e=") !== -1 ? 'SUBMIT EDIT' : 'SUBMIT');
    });
    if (!rawResponse)
      return;
    if (rawResponse.status !== 200) {
      // something went wrong
      $('#fail').prop("hidden", false);
      $('button').prop("disabled", false);
      $('button > strong').text($('#editlink').val().indexOf("?e=") !== -1 ? 'SUBMIT EDIT' : 'SUBMIT');
      return;
    }
    // success
    const content = await rawResponse.json();
    $('#editlink').val(location.origin + location.pathname + "?e=" + content.id);
    $('#lastsubmit').text(new Date().toLocaleString());
    $('#success').prop("hidden", false);
    $('button').prop("disabled", false);
    $('button > strong').text($('#editlink').val().indexOf("?e=") !== -1 ? 'SUBMIT EDIT' : 'SUBMIT');
  })();
}

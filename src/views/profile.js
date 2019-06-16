module.exports = (email, src) => `
<div class="row">
  <div class="col-xs-3"><img class="devsite-avatar" src="${src}" onclick="showOptions();" />
    <div id="options" style="display: none;position: absolute;top: 10px;right: 10px;width: 200px;">
      <button class="btn btn-default" onclick="signOut();">Sign out</button>
      <button class="btn btn-default" onclick="disconnect();">Disconnect</button>
    </div>
  </div>
</div>`
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Export</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="./dist/sidebar-menu.css">
  <link rel="stylesheet" href="./css/jquery.dataTables.min.css">
  <script src="https://code.jquery.com/jquery-3.0.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
</head>
<!-- Some styling for https://github.com/huang-x-h/sidebar-menu-->
<style>
  html,
  body {
    margin:0;
    padding:0;
  }
  body{
    height:100vh;
    background-color: #ebf3ff;
    display: flex;
  }
  * {
  box-sizing: border-box;
  }
  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .content {
    height:100%;
    flex:1;
    max-height: 100%;
    padding: 16px;
  }
  .headermargin{
    margin-top: 20px;
    margin-bottom: 10px;
  }
  .modal-backdrop.show {
    opacity: .5;
  }
  .same-line {
    display: flex;
    justify-content: center;
  }
  .same-line-right {
    display: flex;
    justify-content: right;
  }
  .close-right{
    position: absolute;
    right: 16px;
  }
  .context-menu-icon-delete{
    color: red !important;
  }
  .context-menu-icon::before{
    color: inherit !important;
  }
  .hide {
    visibility: hidden;
  }
  .context-menu-icon.context-menu-icon--fa {/*override weight from fa class which causes very bold text for share in context menu*/
    font-weight: inherit !important;
  }
  .card {/* FROM https://atranathemes.github.io/Atrana/layout-top-navigation.html */
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-clip: border-box;
    margin-top: 1vh;
  }
  .card-body{
    padding: 1.4rem 1.7rem;
    background-color: #ffffff;
    flex: 1 1 auto;
  }
  .form-font-weight{
    font-weight: 500;
  }
  .inputbox i {
    right:0px;
    position: absolute;
    cursor: pointer;
    z-index: 99;
    padding: 0.375rem 0.75rem;
    line-height: 1.5;
  }
  .inputbox {
    outline: none;
    position: relative;
  }
  .inputbox input{
    background-color: unset !important;
    width:100%;
  }
  .range input[type="range"]{
    width:100%;
  }
  .pwd-length input[type="number"]{
    width: 3.5em;
    right:0px;
    position: absolute;
  }
  .pwd-length {
    padding: 10px 5px 10px 5px;
  }
  .pwd-label {
    font-weight: 500;
  }
  .settings{
    display: flex;
    padding-left: 5px;
    flex-wrap: wrap;
  }
  .settings li{
    align-items: center;
    width: 50%;
    display: flex !important;
  }
  .settings label{
    padding-left: 0.5em;
  }
  .centerpage {
    width: 50%;
    left: 25%;
    position: relative;
  }
  .centerpage button{
    width:-webkit-calc(50% - 1px);
  }
  .btn-success{
    float:right;
  }
  .modal-backdrop.show {
    opacity: .5;
  }
  button.close{
  -webkit-appearance: none;
    padding: 0;
    cursor: pointer;
    background: 0 0;
    border: 0;
  }
  .close{
    float: right;
    font-size: 21px;
    font-weight: 700;
    line-height: 1;
    color: #000;
    text-shadow: 0 1px 0 #fff;
    filter: alpha(opacity=20);
    opacity: .2;
    margin-top: -2px;
  }
  .modal-header {
    align-items: unset;
  }
  .modal-footer .btn+.btn {
    margin-bottom: 0;
    margin-left: 5px;
}
</style>
<body>
  <?php 
  $page="pwdgen";
  include("nav.php"); ?>
 
  <section class="content">
    <div class="content-header">
      <h1>Generate a random password</h1>
    </div>
    <!-- The Modal --><!-- https://www.w3schools.com/bootstrap4/tryit.asp?filename=trybs_modal_scroll2&stacked=h-->
  <div class="modal" id="myModal">
    <div class="modal-dialog modal-dialog-scrollable modal-lg">
      <div class="modal-content">
      
        <!-- Modal Header -->
        <div class="modal-header same-line">
          <h1 class="modal-title can-change text-center">Add Password</h1>
          <button type="button" class="close close-right" data-dismiss="modal">×</button>
        </div>
        
        <!-- Modal body -->
        <div class="modal-body">
          <form onsubmit="return false"><!--Dont allow form submission as handled seperately by the buttons-->
            <div class="form-group">
              <label for="url">URL / IP</label>
              <input type="text" class="form-control add-password" id="url" aria-describedby="urlHelp" placeholder="Enter URL">
              <small id="urlHelp" class="form-text text-muted">This is the web address of the site.</small>
            </div>
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" class="form-control add-password" id="name" aria-describedby="nameHelp" placeholder="Name">
              <small id="urlHelp" class="form-text text-muted">This will be used as a nickname to help find the site e.g. Netflix.</small>
            </div>
            <div class="form-group">
              <label for="username">Username / Email</label>
              <input type="text" class="form-control add-password" id="username" placeholder="Username / Email">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" class="form-control add-password" id="password" placeholder="Password">
            </div>
          </form>
        </div>
        
        <!-- Modal footer -->
        <div class="modal-footer">
          <div class="same-line-right">
            <button type="submit" class="btn btn-success" id="add-password">Save</button>          
            <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
          </div>
        </div>
        
      </div>
    </div>
  </div>
    <div class="card">
        <div class="card-body">
            <div class="centerpage">
                <div class="inputbox">
                    <i class="fa fa-copy"></i>
                    <input type="text" id="password-output" class="form-control" spellcheck="false" readonly>
                </div>
                <div class="pwd-length">
                    <label class="pwd-label">Password Length</label>
                    <input type="number" min="0" value="30" />
                </div>
                <div class="range">
                    <input type="range" min="0" max="100" value="30" />
                </div>
                <label class="pwd-label">Password Settings</label>
                <ul class="settings">
                    <li class="form-check">
                        <input class="form-check-input" type="checkbox" checked />
                        <label class="form-check-label">Lowercase (a-z)</label>
                    </li>
                    <li class="form-check">
                        <input class="form-check-input" type="checkbox" checked />
                        <label class="form-check-label">Uppercase (A-Z)</label>
                    </li>
                    <li class="form-check">
                        <input class="form-check-input" type="checkbox" checked />
                        <label class="form-check-label">Numbers (0-9)</label>
                    </li>
                    <li class="form-check">
                        <input class="form-check-input" type="checkbox" checked />
                        <label class="form-check-label">Special Characters (!~@)</label>
                    </li>
                </ul>
                <button type="button" class="btn btn-primary" id="generate">Generate Password</button>
                <button type="button" class="btn btn-success" id="addpassword">Add Password</button>
            </div>
        
        </div>
    </div>
  </section>


  <script src="./js/jquery.dataTables.min.js"></script>
  <script src="./dist/sidebar-menu.js"></script>
  <script src="node_modules/argon2-browser/lib/argon2.js"></script>
  <script src="js/aes.js"></script>
  <script src="./js/functions/functions.js"></script>
  <script src="./js/pwdgen.js"></script>
  <script>
    $.sidebarMenu($('.sidebar-menu'))
  </script>
</body>

</html>

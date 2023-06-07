<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Dashboard</title>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
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
  .green{
    color: green;
  }
  .orange{
    color: darkorange;
  }
  .pad-right{
    padding-right: 0.25em;
  }
</style>
<body>
  <?php 
  $page="dashboard";
  include("nav.php"); ?>
 
  <section class="content">
    <div class="content-header">
      <h1>Passwords</h1>
      <button class="btn btn-primary headermargin" data-toggle="modal" data-target="#myModal">Add Password</button>
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
            <input type="hidden" class="add-password" name="editid" id="editid"></input>
          </form>
        </div>
        
        <!-- Modal footer -->
        <div class="modal-footer">
          <div class="same-line-right">
            <button type="submit" class="btn btn-success" id="add-password">Save</button>
            <button type="submit" class="btn btn-success hide" id="edit-password">Save</button>
            <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
          </div>
        </div>
        
      </div>
    </div>
  </div>
  <div class="modal" id="sharingModal">
    <div class="modal-dialog modal-dialog-scrollable modal-lg">
      <div class="modal-content">
      
        <!-- Modal Header -->
        <div class="modal-header same-line">
          <h1 class="modal-title text-center">Share</h1>
          <button type="button" class="close close-right" data-dismiss="modal">×</button>
        </div>
        
        <!-- Modal body -->
        <div class="modal-body row">
          <div class="col-xs-6">
            <form onsubmit="return false"><!--Dont allow form submission as handled seperately by the buttons-->
              <div class="form-group">
                <label for="url">Share With</label>
                <input type="text" class="form-control share" id="shareemail" aria-describedby="shareemailHelp" placeholder="Enter recipient email">
                <small id="urlHelp" class="form-text text-muted">Enter the email of the user you want to share the password with.</small>
              </div>
              <div class="form-group form-check">
                <input type="checkbox" class="form-check-input" id="editpermission" value="1">
                <label class="form-check-label" for="editpermission">Allow user permission to edit</label>
              </div>
              <input type="hidden" class="share" name="passwordid" id="passwordid"></input>
              <button type="submit" class="btn btn-success" id="sharepassword">Share</button> 
              <small id="errortext" class="form-text text-center text-danger"></small>
            </form>
          </div>
          <div class="col-xs-6">
            <label for="">Already sharing with</label>
            <table id="sharingtbl" class="display" width="100%"></table>
            <small id="errortextsharing" class="form-text text-center text-danger"></small>
          </div>
        </div>
        
        
        <!-- Modal footer -->
        <div class="modal-footer">
          <div class="same-line-right">         
          <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
          </div>
        </div>
        
      </div>
    </div>
  </div>
  <div>
    <table id="passwords" class="display" width="100%"></table>
  </div>
  </section>


  <script src="./js/jquery.dataTables.min.js"></script>
  <script src="./dist/sidebar-menu.js"></script>
  <script src="node_modules/argon2-browser/lib/argon2.js"></script>
	<script src="js/aes.js"></script>
  <link rel="stylesheet" href="js/contextmenu/jquery.contextMenu.min.css"><!-- FROM http://swisnl.github.io/jQuery-contextMenu/index.html -->
  <script src="js/contextmenu/jquery.contextMenu.js"></script>
  <script src="js/contextmenu/jquery.ui.position.min.js"></script>
  <script src="./js/functions/functions.js"></script>
  <script src="./js/dashboard.js"></script>
  <script>
    $.sidebarMenu($('.sidebar-menu'))
  </script>
</body>

</html>

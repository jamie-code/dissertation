<script>
<?php
include("./js/logout.js");
?>
</script>
<style>
    .pull-right {
        float: right!important;
    }
    .currentuserdiv {
      padding: 10px 25px 10px 15px;
    }
    .currentuser {
      color: #b8c7ce;
      word-wrap: break-word;
    }
    .navsection {
      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
      font-size: 14px;
      /*line-height:1.5;*/
    }
    body {
      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif !important;
    }
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
<!--https://github.com/huang-x-h/sidebar-menu-->
<section style="width: 200px;height: 100%;" class="navsection">
    <ul class="sidebar-menu" style="height:100%;">
      <li style="color:#b8c7ce; font-size: 32px; padding: 10px 25px 10px 15px;">Password Manager</li>
      <li class="sidebar-header">MAIN NAVIGATION</li>
      <?=$page=="dashboard" ? '<li class="active">' : '<li>' ?>
        <a href="dashboard.php">
          <i class="fa fa-dashboard"></i> <span>Dashboard</span>
        </a>
      </li>
      <?=$page=="sharing" ? '<li class="active">' : '<li>' ?>
        <a href="sharing.php">
          <i class="fa fa-handshake"></i> <span>Sharing</span>
        </a>
      </li>
      <?=$page=="pwdgen" ? '<li class="active">' : '<li>' ?>
        <a href="pwdgen.php">
          <i class="fa fa-keyboard"></i> <span>Password Generator</span>
        </a>
      </li>
      <?php
      $settings_pages=["2fa", "export"];//Used to open the settings submenu for pages that are contained within
      ?>
      <?=in_array($page, $settings_pages) ? '<li class="active">' : '<li>' ?>
        <a href="#">
          <i class="fa fa-gear"></i>
          <span>Settings</span>
          <i class="fa fa-angle-left pull-right"></i>
        </a>
        <ul class="sidebar-submenu">
          <!--<li><a href="settings.php"><i class="fa fa-gear"></i> Settings</a></li>-->
          <?=$page=="2fa" ? '<li class="active">' : '<li>' ?><a href="2fa.php"><i class="fa fa-key"></i> 2FA</a></li>
          <?=$page=="export" ? '<li class="active">' : '<li>' ?><a href="export.php"><i class="fa fa-file-export"></i> Export</a></li>
        </ul>
      </li>
      <li><a href="#" onclick="logout()"><i class="fa fa-sign-out"></i> Logout</a></li>
      <li class="sidebar-header">LOGGED IN AS</li>
      <div class="currentuserdiv"><li class="currentuser" id="currentuser"></li></div>
    </ul>
    
  </section>
  <script>
    let email = localStorage.getItem('pwdmgr-email');
    document.getElementById("currentuser").textContent = email;
    
  </script>
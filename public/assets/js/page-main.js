(function(){
	var logoutTimmer = 0;
	var key = "";
  var version = "";

	jQuery(document).ready(function () {
		setBg();
		getKeys();
		onLoginStateChange();
		handleFormEvents();
    getProductVersionAndUpdateDate();

		$('#signout').click(function (event) {
			/* Act on the event */
			firebase.auth().signOut();
		}); // end click
	}); // end ready

	window.onload = function () {
		if (firebase) {
			logoutTimmer = setTimeout(function () {
				firebase.auth().signOut();
				// window.alert("timeout so sign out");
			}, 6000000);
		}
	}; // end onload

	window.onunload = function () {
		clearTimeout(logoutTimmer);
		// firebase.auth().signOut();
	}; // end onunload

	function getKeys() {
		firebase.database().ref('tokens/github').on('value', function (snapshot) {
			key = snapshot.val();
		});
	} // end getKeys

	function setBg() {
		$.backstretch([
        // "../assets/img/backgrounds/2.jpg",
        // "../assets/img/backgrounds/3.jpg",
        // "../assets/img/backgrounds/1.jpg"
        "../assets/img/backgrounds/bg.jpg"
    ], {
			duration: 3000,
			fade: 750
		});
	} // end setBg

	function handleFormEvents() {
		// Form validation
		$('input[name="form-title"] .post-form textarea').on('focus', function () {
			$(this).removeClass('input-error');
		});
		$('.post-form').on('submit', function (e) {
			$(this).find('input, textarea').each(function () {
				if ($(this).val() == "") {
					e.preventDefault();
					$(this).addClass('input-error');
				} else {
					$(this).removeClass('input-error');
				}
			});
			if (!$(this).hasClass('input-error')) {
				// using title field to save user name for instead.
				// var title = $(this).find('input[name="form-title"]').val();
				var title = "user-issues-report"
				var username = $(this).find('input[name="form-title"]').val();
				var post = $(this).find('textarea[name="form-post"]').val();
				// var username = firebase.auth().currentUser.displayName || firebase.auth().currentUser.email.split("@")[0];
				// console.log("username =>", username);
				// console.log("post =>", post);
				e.preventDefault();
				if (username !== "" && post !== "") {
					swal({
							title: "Submit Report",
							text: "Please ensure everything you typed in is correct.",
							type: "info",
							showCancelButton: true,
							confirmButtonClass: "btn-danger",
							confirmButtonText: "Yes",
							cancelButtonText: "No, Cancel.",
							closeOnConfirm: false,
							showLoaderOnConfirm: true,
						},
						function () {
							setTimeout(function () {
								writeNewPost(
									firebase.auth().currentUser.uid,
									username,
									title,
									post);
								handleCreateAnIssue(title, post, username, function () {
									swal("Thank You", "We will receive your feedback soon!", "success");
									$('input[name="form-title"]').val("");
									$('textarea[name="form-post"]').val("");
								});
							}, 2000);
						});
				}
			}
		});
	} // end handleFormEvents

	function writeNewPost(uid, username, title, body) {
		// A post entry.
		var postData = {
			author: username,
			uid: uid,
			body: body,
			title: title,
			agent: navigator.userAgent,
			starCount: 0
		};

		// Get a key for a new Post.
		var newPostKey = firebase.database().ref().child('posts').push().key;

		// Write the new post's data simultaneously in the posts list and the user's post list.
		var updates = {};
		updates['/posts/' + newPostKey] = postData;
		updates['/user-posts/' + uid + '/' + newPostKey] = postData;

		return firebase.database().ref().update(updates);
	} // end writeNewPost

	function onLoginStateChange() {
		// Listening for auth state changes.
		firebase.auth().onAuthStateChanged(function (user) {
			// User is signed in.
			if (user) {
				// get file download link from db
				firebase.database().ref('hosting/download').on('value', function (snapshot) {
					var links = snapshot.val();
					// auto dec os to give different download link.
					// if (navigator.userAgent.indexOf("Macintosh") !== -1) {
					$('.download-mac').attr('href', links.mac);
					// } else {
          var win64Check1 = navigator.userAgent.indexOf('WOW64') > -1;
          var win64Check2 = window.navigator.platform=='Win64';
          var isWin64 = win64Check1 || win64Check2;
          if (isWin64) {
  					$('.download-windows').attr('href', links.win);
          } else {
  					$('.download-windows').attr('href', links.win32);
          }
          // }

					$('.download-windows, .download-windows32').click(function (e) {
						e.preventDefault();
						swalDownload({
							title: "Attention!",
							text: "Please be sure you have already read section Q＆A.",
							type: "info",
							link: $(this).attr('href'),
							okBtnText: "OK",
						});
					});
					$('.download-mac').click(function (e) {
						e.preventDefault();
						swalDownload({
							title: "Attention!",
							text: "Please be sure you have already read section Q＆A.",
							type: "info",
							link: $(this).attr('href'),
							okBtnText: "OK",
						});
					});
					// }
				});

			} else {
				// User is signed out.
				// window.alert("Signedout");
				// console.log('Signed out');
				window.location.assign("../");
				// [END_EXCLUDE]
			}
			// [START_EXCLUDE silent]
			// document.getElementById('quickstart-sign-in').disabled = false;
			// [END_EXCLUDE]
		});
		// [END authstatelistener]
	} // end onLoginStateChange

	function handleCreateAnIssue(title, content, username, cb) {
		var body = content +
			"\n-------\n" +
			" by user \"" + username + "\"\n" + navigator.userAgent;
		var post = $.ajax({
			url: 'https://api.github.com/repos/trunk-studio/system-agent-core/issues',
			type: 'post',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'token ' + key,
			},
			dataType: "json",
			data: JSON.stringify({
				"encoding": "utf-8",
				"title": title + "-" + version,
				"body": body,
				"labels": [
        "ByPlatform"
      ],
			}),
			success: function (data) {
				// console.log(data);
				cb();
			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				swal("Error", "There's something wrong in connection between you and issue report server. Please try again later.\nerror code:101", "warning");
				console.log("create issue error=>", textStatus);
			}
		});
	} // end createAnIssue

  function getProductVersionAndUpdateDate() {
		firebase.database().ref('hosting/productInfo').on('value', function (snapshot) {
      var values = snapshot.val();
			$("#product_version").text(values.version);
			$("#product_date").text(values.date);
      version = values.version;
		});
  } // end getProductVersionAndUpdateDate

	function swalDownload(config) {
		swal({
				title: config.title,
				text: config.text,
				type: config.type,
				confirmButtonClass: "btn-danger",
				confirmButtonText: config.okBtnText,
				closeOnConfirm: false,
				showLoaderOnConfirm: true,
			},
			function () {
				setTimeout(function () {
					swal("Your download will be start in few second.");
					window.location = config.link;
				}, 1000);
			});
	} // end swalDownload

})();

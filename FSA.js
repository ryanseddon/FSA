/*
 * FSA.js  - File system access
 * http://www.thecssninja.com/javascript/filesystem
 *
 * Copyright (c) 2010 Ryan Seddon 
 * Dual-licensed under the BSD and MIT licenses.
 * http://thecssninja.com/license.txt
 */
 
var FSA = FSA || {};

(function(w,d) {
	var fsys, root, fileReader;
	
	FSA.requestFSAccess = function(type,size) {
		if("requestFileSystem" in w) {
			w.requestFileSystem( type, size /* ~5MB */, function(fs) {
				fsys = fs;
				root = fsys.root;
			}, FSA.error);
		} else { // No filesystem access :(
			alert("Unfortunately your browser doesn't yet support the File API: Directories and System specification");
		}
	}
	
	FSA.write2File = function(name,data,mimetype) {
		var e = this || null;
		
		name = name || e.target.name;
		data = data || e.target.result;
		mimetype = mimetype || (e.target) ? e.target.type : "text/plain";
		
		root.getFile(name, {create: true}, function(fileEntry) {
			fileEntry.createWriter(function(writer) {  // FileWriter

				writer.onwrite = function(e) {
					console.log(name + ' written successfully to filesystem.');
					FSA.getFile(name);
				};

				writer.onerror = function(e) {
					console.log('Write failed: ' + e);
				};

				var bb = new BlobBuilder();
				bb.append(data);
				writer.seek(writer.length); // Always append text to end of file.
				writer.write(bb.getBlob(mimetype));

			});
		}, FSA.error );
	};
	
	FSA.getFile = function(name,callback) {
		var isFunc = (typeof callback == "function");
		
		root.getFile(name, null, function(fileEntry) {
			fileEntry.file(function(f) {
				if(isFunc) {
					callback(f);
				}
			}, FSA.error);
		}, FSA.error );
	};
	
	FSA.getFiles = function(path,callback) {
		var isFunc = (typeof callback == "function"),
			dirReader = root.createReader();
		
		dirReader.readEntries(function(files) {
			for (var i = 0, len = files.length; i < len; i++) {
				if(files[i].isFile) {
					files[i].file(function(f) {
						if(isFunc) {
							callback(f);
						}
					}, FSA.error);
				}
			}
		}, FSA.error);
	};
	
	FSA.readFile = function(name,type,callback) {
		
		if(typeof name == "object") {
			readFile(name,type,callback);
		} else {
			root.getFile(name, null, function(fileEntry) {
				fileEntry.file(function(file) {
					
					readFile(file,type,callback);
					
				}, FSA.error);
			}, FSA.error );
		}
	};
	
	FSA.createFile = function(name,callback) {
		var isFunc = (typeof callback == "function");
		
		root.getFile(name, {create:true,exclusive:true}, function(){ 
			if(isFunc) {
				callback(name);
			}
		}, FSA.error );
	};
	
	FSA.createDirectory = function(name) {
		root.getDirectory(name, {create: true,exclusive:true}, function(){ console.log(name + " directory created"); }, FSA.error);
	};
	
	FSA.removeDirectory = function(path) {
		root.getDirectory(path,null,function(dir) {
			console.log(dir);
			dir.removeRecursively(function() {
				console.log("'" + path + "' and all its contents was succesfully removed");
			}, FSA.error);
		}, FSA.error);
	};
	
	FSA.error = function(e) {
		switch(e.code) {
			case 1:
				console.log("File or directory doesn't exist");
				break;
			case 2:
				console.log("Stop being silly");
				break;
			case 9:
				console.log("You've already created it");
				console.log(e);
				break;
			case 10:
				console.log("You've either exceeded your storage quota or you didn't launch Chrome with the '--unlimited-quota-for-files' flag set. See article for instructions on how to do it.");
				break;
			default:
				console.log(e);
		}
	};
	
	// Internal use only
	function readFile(file,type,callback) {
		var validReadType = /^(text|binary|arraybuffer|dataurl)$/i;
			readAs = "text",
			that = this;
		
		if(validReadType.test(type)) {
			readAs = type.toLowerCase();
		}
		
		fileReader = new FileReader();
		fileReader.onloadend = function(e) { callback(e.target.result) };
		fileReader.onerror = function(e) { FSA.error(e); };
		
		switch(type) {
			case "dataurl":
				fileReader.readAsDataURL(file);
				break;
			case "arraybuffer":
				fileReader.readAsArrayBuffer(file);
				break;
			case "binary":
				fileReader.readAsBinaryString(file);
				break;
			default:
				fileReader.readAsText(file);
		}
		
	}
})(window,document);
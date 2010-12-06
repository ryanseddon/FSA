/*
 * FSA.js  - File system access
 * http://www.thecssninja.com/javascript/filesystem
 *
 * Copyright (c) 2010 Ryan Seddon 
 * Dual-licensed under the BSD and MIT licenses.
 * http://thecssninja.com/demo/license.txt
 */
 
var FSA = FSA || {};

(function(w,d) {
	var fsys, root, fileReader;
	
	FSA.requestFSAccess = function(type,size) { // If type is a string will ignore it and fallback to temporary FS.
		var re = /^(\[object Number\]|\[object Boolean\])$/i;
		
		if("requestFileSystem" in w) {
			if(re.test(typeCheck(type)) && typeCheck(size) === "[object Number]") {
				w.requestFileSystem( type, size /* bytes */, function(fs) {
					fsys = fs;
					root = fsys.root;
				}, errorHandler);
			}
		} else { // No filesystem access :(
			alert("Unfortunately your browser doesn't yet support the File API: Directories and System specification");
		}
	};
	
	FSA.write2File = function(name,data,mimetype) {
		var e = this || null;
		
		name = name || e.target.name;
		data = data || e.target.result;
		mimetype = mimetype || (e.target) ? e.target.type : "text/plain";
		
		root.getFile(name, {create: true}, function(fileEntry) {
			fileEntry.createWriter(function(writer) {  // FileWriter

				writer.onwrite = function(e) {
					console.log(name + ' written successfully to filesystem.');
				};

				writer.onerror = function(e) {
					console.log('Write failed: ' + e);
				};

				var bb = new BlobBuilder();
				bb.append(data);
				writer.seek(writer.length); // Always append text to end of file.
				writer.write(bb.getBlob(mimetype));

			});
		}, errorHandler );
	};
	
	FSA.getFile = function(name,callback) {
		root.getFile(name, null, function(fileEntry) {
			fileEntry.file(function(f) {
				if(typeCheck(callback) === "[object Function]") {
					callback(f);
				}
			}, errorHandler);
		}, errorHandler );
	};
	
	FSA.getFiles = function(path,callback) {
		var dirReader = root.createReader();
		
		dirReader.readEntries(function(files) {
			for (var i = 0, len = files.length; i < len; i++) {
				if(files[i].isFile) {
					files[i].file(function(f) {
						if(typeCheck(callback) === "[object Function]") {
							callback(f);
						}
					}, errorHandler);
				}
			}
		}, errorHandler);
	};
	
	FSA.readFile = function(name,type,callback) {
		
		if(typeof name == "object") {
			readFile(name,type,callback);
		} else {
			root.getFile(name, null, function(fileEntry) {
				fileEntry.file(function(file) {
					
					readFile(file,type,callback);
					
				}, errorHandler);
			}, errorHandler );
		}
	};
	
	FSA.createFile = function(name,callback) {
		root.getFile(name, {create:true,exclusive:true}, function(){ 
			if(typeCheck(callback) === "[object Function]") {
				callback(name);
			}
		}, errorHandler );
	};
	
	FSA.createDirectory = function(name) {
		root.getDirectory(name, {create: true,exclusive:true}, function(){ console.log(name + " directory created"); }, errorHandler);
	};
	
	FSA.removeDirectory = function(path) {
		root.getDirectory(path,null,function(dir) {
			console.log(dir);
			dir.removeRecursively(function() {
				console.log("'" + path + "' and all its contents was succesfully removed");
			}, errorHandler);
		}, errorHandler);
	};
	
	// Internal use, no need to expose these funtions
	function readFile(file,type,callback) {
		var validReadType = /^(text|binary|arraybuffer|dataurl)$/i,
			readAs = "text";
		
		if(validReadType.test(type)) {
			readAs = type.toLowerCase();
		}
		
		fileReader = new FileReader();
		fileReader.onloadend = function(e) { callback(e.target.result); };
		fileReader.onerror = function(e) { errorHandler(e); };
		
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
	function typeCheck(o) {
		return Object.prototype.toString.call(o);
	}
	function errorHandler(e) {
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
	}
})(window,document);
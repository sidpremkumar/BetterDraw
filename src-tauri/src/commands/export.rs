use std::fs;

#[tauri::command]
pub fn export_png(path: String, data: Vec<u8>) -> Result<(), String> {
    fs::write(&path, &data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_svg(path: String, data: String) -> Result<(), String> {
    fs::write(&path, &data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_excalidraw(path: String, data: String) -> Result<(), String> {
    fs::write(&path, &data).map_err(|e| e.to_string())
}

#[cfg(target_os = "macos")]
#[tauri::command]
pub fn copy_png_to_clipboard(data: Vec<u8>) -> Result<(), String> {
    use objc::runtime::{Class, Object};
    use objc::{msg_send, sel, sel_impl};

    unsafe {
        let pasteboard_class = Class::get("NSPasteboard").ok_or("NSPasteboard not found")?;
        let pasteboard: *mut Object = msg_send![pasteboard_class, generalPasteboard];
        let _: i64 = msg_send![pasteboard, clearContents];

        let nsdata_class = Class::get("NSData").ok_or("NSData not found")?;
        let ns_data: *mut Object = msg_send![nsdata_class, dataWithBytes:data.as_ptr() length:data.len()];

        // NSPasteboardTypePNG = "public.png"
        let nsstring_class = Class::get("NSString").ok_or("NSString not found")?;
        let png_type: *mut Object = msg_send![nsstring_class, stringWithUTF8String:b"public.png\0".as_ptr()];

        let success: bool = msg_send![pasteboard, setData:ns_data forType:png_type];

        if success {
            Ok(())
        } else {
            Err("Failed to set clipboard data".to_string())
        }
    }
}

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use once_cell::sync::Lazy;
use rusqlite::{params_from_iter, Connection, types::ValueRef};
use serde_json::{json, Value};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

struct AppDb {
    conn: Mutex<Option<Connection>>,
    path: Mutex<Option<PathBuf>>,
}

static DB: Lazy<AppDb> = Lazy::new(|| AppDb {
    conn: Mutex::new(None),
    path: Mutex::new(None),
});

fn value_to_json(v: ValueRef<'_>) -> Value {
    match v {
        ValueRef::Null => Value::Null,
        ValueRef::Integer(i) => json!(i),
        ValueRef::Real(f) => json!(f),
        ValueRef::Text(t) => json!(String::from_utf8_lossy(t).to_string()),
        ValueRef::Blob(b) => json!(b),
    }
}

fn open_connection(path: &PathBuf) -> Result<Connection, String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA foreign_keys = ON;").map_err(|e| e.to_string())?;
    Ok(conn)
}

#[tauri::command]
fn native_db_open(app: AppHandle, file_name: Option<String>) -> Result<String, String> {
    let name = file_name.unwrap_or_else(|| "beiwanglu.sqlite".into());
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let path = dir.join(name);
    let conn = open_connection(&path)?;
    *DB.conn.lock().map_err(|e| e.to_string())? = Some(conn);
    *DB.path.lock().map_err(|e| e.to_string())? = Some(path.clone());
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn native_db_path() -> Result<Option<String>, String> {
    let path = DB.path.lock().map_err(|e| e.to_string())?;
    Ok(path.as_ref().map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
fn native_db_exec(sql: String, params: Option<Vec<Value>>) -> Result<(), String> {
    let guard = DB.conn.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or_else(|| "database not opened".to_string())?;
    let params = params.unwrap_or_default();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let bind: Vec<rusqlite::types::Value> = params
        .into_iter()
        .map(|v| match v {
            Value::Null => rusqlite::types::Value::Null,
            Value::Bool(b) => rusqlite::types::Value::Integer(if b { 1 } else { 0 }),
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    rusqlite::types::Value::Integer(i)
                } else if let Some(f) = n.as_f64() {
                    rusqlite::types::Value::Real(f)
                } else {
                    rusqlite::types::Value::Text(n.to_string())
                }
            }
            Value::String(s) => rusqlite::types::Value::Text(s),
            other => rusqlite::types::Value::Text(other.to_string()),
        })
        .collect();
    stmt.execute(params_from_iter(bind.iter()))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn native_db_query(sql: String, params: Option<Vec<Value>>) -> Result<Value, String> {
    let guard = DB.conn.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or_else(|| "database not opened".to_string())?;
    let params = params.unwrap_or_default();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let bind: Vec<rusqlite::types::Value> = params
        .into_iter()
        .map(|v| match v {
            Value::Null => rusqlite::types::Value::Null,
            Value::Bool(b) => rusqlite::types::Value::Integer(if b { 1 } else { 0 }),
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    rusqlite::types::Value::Integer(i)
                } else if let Some(f) = n.as_f64() {
                    rusqlite::types::Value::Real(f)
                } else {
                    rusqlite::types::Value::Text(n.to_string())
                }
            }
            Value::String(s) => rusqlite::types::Value::Text(s),
            other => rusqlite::types::Value::Text(other.to_string()),
        })
        .collect();

    let column_count = stmt.column_count();
    let mut columns = Vec::with_capacity(column_count);
    for i in 0..column_count {
        columns.push(stmt.column_name(i).unwrap_or("").to_string());
    }

    let mut rows_iter = stmt
        .query(params_from_iter(bind.iter()))
        .map_err(|e| e.to_string())?;
    let mut values: Vec<Vec<Value>> = Vec::new();
    while let Some(row) = rows_iter.next().map_err(|e| e.to_string())? {
        let mut row_vals = Vec::with_capacity(column_count);
        for i in 0..column_count {
            let v = row.get_ref(i).map_err(|e| e.to_string())?;
            row_vals.push(value_to_json(v));
        }
        values.push(row_vals);
    }

    Ok(json!([{ "columns": columns, "values": values }]))
}

#[tauri::command]
fn native_db_execute_batch(sql: String) -> Result<(), String> {
    let guard = DB.conn.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or_else(|| "database not opened".to_string())?;
    conn.execute_batch(&sql).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            native_db_open,
            native_db_path,
            native_db_exec,
            native_db_query,
            native_db_execute_batch,
            read_text_file
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // App menu
            let new_note = MenuItem::with_id(app, "new_note", "新建笔记", true, Some("CmdOrCtrl+N"))?;
            let import_item = MenuItem::with_id(app, "import", "导入笔记…", true, Some("CmdOrCtrl+O"))?;
            let settings = MenuItem::with_id(app, "settings", "设置", true, Some("CmdOrCtrl+,"))?;
            let quit = PredefinedMenuItem::quit(app, Some("退出"))?;
            let file_menu = Submenu::with_items(
                app,
                "文件",
                true,
                &[&new_note, &import_item, &PredefinedMenuItem::separator(app)?, &settings, &quit],
            )?;
            let edit_menu = Submenu::with_items(
                app,
                "编辑",
                true,
                &[
                    &PredefinedMenuItem::undo(app, None)?,
                    &PredefinedMenuItem::redo(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::cut(app, None)?,
                    &PredefinedMenuItem::copy(app, None)?,
                    &PredefinedMenuItem::paste(app, None)?,
                    &PredefinedMenuItem::select_all(app, None)?,
                ],
            )?;
            let focus_search =
                MenuItem::with_id(app, "focus_search", "搜索笔记", true, Some("CmdOrCtrl+K"))?;
            let view_menu = Submenu::with_items(app, "查看", true, &[&focus_search])?;
            let menu = Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu])?;
            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| {
                let id = event.id().as_ref();
                match id {
                    "new_note" => {
                        let _ = app.emit("menu://new-note", ());
                        show_main_window(app);
                    }
                    "import" => {
                        let _ = app.emit("menu://import", ());
                        show_main_window(app);
                    }
                    "settings" => {
                        let _ = app.emit("menu://settings", ());
                        show_main_window(app);
                    }
                    "focus_search" => {
                        let _ = app.emit("menu://focus-search", ());
                        show_main_window(app);
                    }
                    _ => {}
                }
            });

            // Tray
            let tray_show = MenuItem::with_id(app, "tray_show", "显示主窗口", true, None::<&str>)?;
            let tray_quit = MenuItem::with_id(app, "tray_quit", "退出", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&tray_show, &tray_quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().expect("missing window icon"))
                .menu(&tray_menu)
                .tooltip("灵感笔记")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "tray_show" => show_main_window(app),
                    "tray_quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            let _ = handle;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

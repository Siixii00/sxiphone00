#!/usr/bin/env python3
"""
Script to convert localStorage operations to async sx-helper functions in chat.js

Usage: python convert-localstorage.py
"""

import re
import os

def convert_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Track functions that need to be made async
    functions_to_make_async = set()
    
    # Pattern 1: localStorage.getItem('xxx') -> await sxGetItem('xxx')
    # Also track which functions contain these calls
    get_item_pattern = r"localStorage\.getItem\(['\"]([^'\"]+)['\"]\)"
    
    def replace_get_item(match):
        key = match.group(1)
        return f"await sxGetItem('{key}')"
    
    # Find all functions containing localStorage operations
    function_pattern = r"(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{"
    
    # Step 1: Mark functions that need to be async
    # Find function definitions and their bodies
    functions_info = []
    for match in re.finditer(function_pattern, content):
        func_name = match.group(1)
        func_start = match.start()
        # Find the function body (simplified - doesn't handle nested functions well)
        brace_count = 0
        func_end = None
        in_func = False
        for i, char in enumerate(content[match.end()-1:]):
            if char == '{':
                brace_count += 1
                in_func = True
            elif char == '}':
                brace_count -= 1
                if in_func and brace_count == 0:
                    func_end = match.end() + i
                    break
        
        if func_end:
            func_body = content[func_start:func_end]
            if 'localStorage.' in func_body:
                functions_info.append({
                    'name': func_name,
                    'start': func_start,
                    'end': func_end,
                    'body': func_body,
                    'has_await': 'await ' in func_body
                })
    
    # Step 2: Replace localStorage operations
    # localStorage.getItem('xxx') -> await sxGetItem('xxx')
    content = re.sub(get_item_pattern, replace_get_item, content)
    
    # localStorage.setItem('xxx', value) -> await sxSetItem('xxx', value)
    set_item_pattern = r"localStorage\.setItem\(['\"]([^'\"]+)['\"],\s*([^)]+)\)"
    def replace_set_item(match):
        key = match.group(1)
        value = match.group(2)
        return f"await sxSetItem('{key}', {value})"
    content = re.sub(set_item_pattern, replace_set_item, content)
    
    # localStorage.removeItem('xxx') -> await sxRemoveItem('xxx')
    remove_item_pattern = r"localStorage\.removeItem\(['\"]([^'\"]+)['\"]\)"
    def replace_remove_item(match):
        key = match.group(1)
        return f"await sxRemoveItem('{key}')"
    content = re.sub(remove_item_pattern, replace_remove_item, content)
    
    # JSON.parse(localStorage.getItem('xxx')) -> await sxGetJSON('xxx')
    json_parse_pattern = r"JSON\.parse\(await sxGetItem\(['\"]([^'\"]+)['\"]\)\)"
    def replace_json_parse(match):
        key = match.group(1)
        return f"await sxGetJSON('{key}')"
    content = re.sub(json_parse_pattern, replace_json_parse, content)
    
    # JSON.stringify for setItem patterns
    # This is trickier - need to handle: localStorage.setItem('xxx', JSON.stringify(value))
    json_stringify_pattern = r"await sxSetItem\(['\"]([^'\"]+)['\"],\s*JSON\.stringify\(([^)]+)\)\)"
    def replace_json_stringify(match):
        key = match.group(1)
        value = match.group(2)
        return f"await sxSetJSON('{key}', {value})"
    content = re.sub(json_stringify_pattern, replace_json_stringify, content)
    
    # Step 3: Make functions async if they contain await and aren't already async
    for func in reversed(functions_info):
        old_func_def = re.search(r"function\s+" + re.escape(func['name']) + r"\s*\(", content)
        if old_func_def:
            # Check if function body now contains 'await'
            new_func_body_start = old_func_def.start()
            # Find the new function body
            brace_count = 0
            func_end = None
            in_func = False
            for i, char in enumerate(content[new_func_body_start:]):
                if char == '{':
                    brace_count += 1
                    in_func = True
                elif char == '}':
                    brace_count -= 1
                    if in_func and brace_count == 0:
                        func_end = new_func_body_start + i + 1
                        break
            
            if func_end:
                new_func_body = content[new_func_body_start:func_end]
                has_await = 'await ' in new_func_body and 'async ' not in content[new_func_body_start:new_func_body_start+50]
                
                if has_await and 'async function' not in content[new_func_body_start:new_func_body_start+20]:
                    # Make it async
                    content = content[:new_func_body_start] + 'async ' + content[new_func_body_start:]
    
    # Write the modified content
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully converted {filepath}")
        print(f"Changes made:")
        print(f"  - localStorage.getItem -> await sxGetItem")
        print(f"  - localStorage.setItem -> await sxSetItem")
        print(f"  - localStorage.removeItem -> await sxRemoveItem")
        print(f"  - JSON.parse(localStorage.getItem) -> await sxGetJSON")
        print(f"  - JSON.stringify patterns -> await sxSetJSON")
    else:
        print("No changes needed")
    
    return content

if __name__ == '__main__':
    filepath = r'E:\new\sxiphone00\apps\chat\chat.js'
    convert_file(filepath)

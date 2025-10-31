import os
import re
from bs4 import BeautifulSoup
import json
import sys

def analyze_html_functionality(file_path):
    """深度分析HTML文件功能和代码质量"""
    try:
        if not os.path.exists(file_path):
            print(f"错误：文件 {file_path} 不存在", file=sys.stderr)
            return None
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # 功能分析
        functionality = {
            "basic_info": {
                "title": soup.title.string if soup.title else "无标题",
                "has_favicon": bool(soup.find('link', rel='icon')),
                "has_meta_description": bool(soup.find('meta', attrs={'name': 'description'})),
                "has_meta_keywords": bool(soup.find('meta', attrs={'name': 'keywords'}))
            },
            "structure": {
                "has_header": bool(soup.find('header')),
                "has_nav": bool(soup.find('nav')),
                "has_main": bool(soup.find('main')),
                "has_footer": bool(soup.find('footer')),
                "has_aside": bool(soup.find('aside')),
                "semantic_sections": len(soup.find_all(['section', 'article', 'aside']))
            },
            "forms_and_inputs": {
                "form_count": len(soup.find_all('form')),
                "input_types": [],
                "has_validation": False,
                "has_placeholder": False
            },
            "media_content": {
                "image_count": len(soup.find_all('img')),
                "video_count": len(soup.find_all('video')),
                "audio_count": len(soup.find_all('audio')),
                "images_with_alt": 0,
                "images_without_alt": 0
            },
            "interactive_elements": {
                "button_count": len(soup.find_all('button')),
                "link_count": len(soup.find_all('a')),
                "external_links": 0,
                "internal_links": 0
            },
            "css_analysis": {
                "inline_styles": len(soup.find_all(style=True)),
                "style_blocks": len(soup.find_all('style')),
                "external_stylesheets": len(soup.find_all('link', rel='stylesheet')),
                "css_frameworks": []
            },
            "javascript_analysis": {
                "inline_scripts": len(soup.find_all('script', src=False)),
                "external_scripts": len(soup.find_all('script', src=True)),
                "jquery_usage": False,
                "modern_frameworks": []
            },
            "accessibility": {
                "aria_labels": len(soup.find_all(attrs={'aria-label': True})),
                "aria_descriptions": len(soup.find_all(attrs={'aria-describedby': True})),
                "role_attributes": len(soup.find_all(attrs={'role': True})),
                "skip_links": len(soup.find_all('a', href=lambda x: x and x.startswith('#')))
            },
            "performance_issues": {
                "large_images": [],
                "missing_lazy_loading": [],
                "blocking_scripts": []
            }
        }
        
        # 详细分析表单和输入
        for form in soup.find_all('form'):
            for input_tag in form.find_all(['input', 'textarea', 'select']):
                input_type = input_tag.get('type', 'text')
                functionality["forms_and_inputs"]["input_types"].append(input_type)
                
                if input_tag.get('required') or input_tag.get('pattern'):
                    functionality["forms_and_inputs"]["has_validation"] = True
                
                if input_tag.get('placeholder'):
                    functionality["forms_and_inputs"]["has_placeholder"] = True
        
        # 分析图片
        for img in soup.find_all('img'):
            if img.get('alt') and img.get('alt').strip():
                functionality["media_content"]["images_with_alt"] += 1
            else:
                functionality["media_content"]["images_without_alt"] += 1
            
            # 检查图片大小（通过src属性判断）
            src = img.get('src', '')
            if src and len(src) > 1000:  # 可能是base64编码的大图片
                functionality["performance_issues"]["large_images"].append(src[:50] + "...")
            
            if not img.get('loading') == 'lazy':
                functionality["performance_issues"]["missing_lazy_loading"].append(src)
        
        # 分析链接
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            if href.startswith('http') and 'localhost' not in href and '127.0.0.1' not in href:
                functionality["interactive_elements"]["external_links"] += 1
            elif href.startswith('#') or href.startswith('/'):
                functionality["interactive_elements"]["internal_links"] += 1
        
        # 分析CSS框架
        for link in soup.find_all('link', rel='stylesheet'):
            href = link.get('href', '')
            if 'bootstrap' in href.lower():
                functionality["css_analysis"]["css_frameworks"].append('Bootstrap')
            elif 'tailwind' in href.lower():
                functionality["css_analysis"]["css_frameworks"].append('Tailwind CSS')
            elif 'bulma' in href.lower():
                functionality["css_analysis"]["css_frameworks"].append('Bulma')
        
        # 分析JavaScript框架
        for script in soup.find_all('script', src=True):
            src = script.get('src', '')
            if 'jquery' in src.lower():
                functionality["javascript_analysis"]["jquery_usage"] = True
            elif 'react' in src.lower():
                functionality["javascript_analysis"]["modern_frameworks"].append('React')
            elif 'vue' in src.lower():
                functionality["javascript_analysis"]["modern_frameworks"].append('Vue.js')
            elif 'angular' in src.lower():
                functionality["javascript_analysis"]["modern_frameworks"].append('Angular')
        
        # 检查阻塞脚本
        for script in soup.find_all('script', src=True):
            if not script.get('async') and not script.get('defer'):
                functionality["performance_issues"]["blocking_scripts"].append(script.get('src'))
        
        return functionality
    
    except Exception as e:
        print(f"分析文件时出错：{str(e)}", file=sys.stderr)
        return None

def generate_functionality_report(analysis):
    """生成功能分析报告"""
    if not analysis:
        return "分析失败"
    
    report = {
        "功能完整性": [],
        "代码质量": [],
        "用户体验": [],
        "性能优化": [],
        "可访问性": [],
        "SEO优化": []
    }
    
    # 功能完整性评估
    if analysis["forms_and_inputs"]["form_count"] > 0:
        report["功能完整性"].append(f"包含{analysis['forms_and_inputs']['form_count']}个表单，支持用户交互")
    
    if analysis["interactive_elements"]["button_count"] > 0:
        report["功能完整性"].append(f"提供{analysis['interactive_elements']['button_count']}个按钮交互元素")
    
    if analysis["media_content"]["image_count"] > 0:
        report["功能完整性"].append(f"包含{analysis['media_content']['image_count']}张图片，丰富视觉内容")
    
    # 代码质量评估
    if analysis["structure"]["semantic_sections"] < 3:
        report["代码质量"].append("语义化标签使用不足，建议增加section、article等标签")
    
    if analysis["css_analysis"]["inline_styles"] > 5:
        report["代码质量"].append(f"存在{analysis['css_analysis']['inline_styles']}处内联样式，建议移至外部CSS文件")
    
    if not analysis["basic_info"]["has_meta_description"]:
        report["代码质量"].append("缺少meta description，影响SEO效果")
    
    # 用户体验评估
    if analysis["forms_and_inputs"]["has_placeholder"]:
        report["用户体验"].append("表单元素使用placeholder提示，提升用户友好性")
    
    if analysis["forms_and_inputs"]["has_validation"]:
        report["用户体验"].append("表单包含验证功能，提高数据质量")
    
    if analysis["media_content"]["images_without_alt"] > 0:
        report["用户体验"].append(f"{analysis['media_content']['images_without_alt']}张图片缺少alt属性，影响可访问性")
    
    # 性能优化建议
    if len(analysis["performance_issues"]["blocking_scripts"]) > 0:
        report["性能优化"].append("存在阻塞加载的脚本，建议添加async或defer属性")
    
    if len(analysis["performance_issues"]["missing_lazy_loading"]) > 0:
        report["性能优化"].append(f"{len(analysis['performance_issues']['missing_lazy_loading'])}张图片未启用懒加载")
    
    # 可访问性评估
    if analysis["accessibility"]["aria_labels"] == 0:
        report["可访问性"].append("缺少ARIA标签，建议为重要元素添加aria-label属性")
    
    if analysis["accessibility"]["role_attributes"] == 0:
        report["可访问性"].append("缺少role属性，建议为自定义组件添加适当的role")
    
    return report

if __name__ == "__main__":
    file_path = r"C:\Users\11466\Desktop\index.html"
    print(f"正在深度分析文件功能：{file_path}")
    
    functionality_result = analyze_html_functionality(file_path)
    
    if functionality_result:
        print("\n=== HTML功能分析报告 ===")
        print(f"页面标题：{functionality_result['basic_info']['title']}")
        print(f"表单数量：{functionality_result['forms_and_inputs']['form_count']}")
        print(f"图片数量：{functionality_result['media_content']['image_count']}")
        print(f"按钮数量：{functionality_result['interactive_elements']['button_count']}")
        print(f"链接数量：{functionality_result['interactive_elements']['link_count']}")
        print(f"语义化区块：{functionality_result['structure']['semantic_sections']}")
        print(f"内联样式：{functionality_result['css_analysis']['inline_styles']}处")
        print(f"外部脚本：{functionality_result['javascript_analysis']['external_scripts']}个")
        
        # 生成详细报告
        detailed_report = generate_functionality_report(functionality_result)
        
        print("\n=== 详细改进建议 ===")
        for category, suggestions in detailed_report.items():
            if suggestions:
                print(f"\n{category}：")
                for i, suggestion in enumerate(suggestions, 1):
                    print(f"  {i}. {suggestion}")
        
        # 输出完整JSON分析结果
        print(f"\n=== 完整分析数据 ===")
        print(json.dumps(functionality_result, indent=2, ensure_ascii=False))
    else:
        print("文件分析失败，请检查文件路径是否正确")
import os
from bs4 import BeautifulSoup
import sys

def analyze_html_file(file_path):
    """分析HTML文件并提供改进建议"""
    try:
        # 检查文件是否存在
        if not os.path.exists(file_path):
            print(f"错误：文件 {file_path} 不存在", file=sys.stderr)
            return None
        
        # 读取文件内容
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 使用BeautifulSoup解析HTML
        soup = BeautifulSoup(content, 'html.parser')
        
        # 收集分析结果
        analysis = {
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "has_doctype": bool(soup.doctype),
            "html_version": "HTML5" if soup.doctype and "html" in str(soup.doctype).lower() else "Unknown",
            "has_charset_meta": bool(soup.find('meta', charset=True)),
            "has_viewport_meta": bool(soup.find('meta', attrs={'name': 'viewport'})),
            "title": soup.title.string if soup.title else "No title",
            "semantic_tags": [],
            "external_css": [],
            "external_js": [],
            "inline_styles_count": len(soup.find_all(style=True)),
            "images_without_alt": []
        }
        
        # 检查语义化标签使用情况
        semantic_tags_list = ['header', 'footer', 'nav', 'main', 'section', 'article', 'aside', 'figure', 'figcaption']
        for tag in semantic_tags_list:
            if soup.find(tag):
                analysis["semantic_tags"].append(tag)
        
        # 检查外部资源引用
        for link in soup.find_all('link', rel='stylesheet'):
            analysis["external_css"].append(link.get('href', 'Unknown'))
        
        for script in soup.find_all('script', src=True):
            analysis["external_js"].append(script.get('src', 'Unknown'))
        
        # 检查图片alt属性
        for img in soup.find_all('img'):
            if not img.get('alt') or img.get('alt').strip() == '':
                analysis["images_without_alt"].append(img.get('src', 'Unknown image'))
        
        return analysis
    
    except Exception as e:
        print(f"分析文件时出错：{str(e)}", file=sys.stderr)
        return None

def generate_recommendations(analysis):
    """根据分析结果生成改进建议"""
    if not analysis:
        return "无法生成建议：分析结果为空"
    
    recommendations = []
    
    # 基础结构建议
    if not analysis["has_doctype"]:
        recommendations.append("添加DOCTYPE声明以确保浏览器正确渲染：<!DOCTYPE html>")
    
    if not analysis["has_charset_meta"]:
        recommendations.append("添加字符编码声明：<meta charset='UTF-8'>")
    
    if not analysis["has_viewport_meta"]:
        recommendations.append("添加视口设置以支持响应式设计：<meta name='viewport' content='width=device-width, initial-scale=1.0'>")
    
    if len(analysis["title"]) < 10:
        recommendations.append("优化页面标题，使其更具描述性（建议长度10-60字符）")
    
    # 语义化建议
    if len(analysis["semantic_tags"]) < 3:
        recommendations.append(f"增加语义化标签的使用（当前使用：{', '.join(analysis['semantic_tags'])}），建议使用header、footer、main、section等标签提升可读性和SEO")
    
    # 性能优化建议
    if analysis["inline_styles_count"] > 5:
        recommendations.append(f"减少内联样式（当前{analysis['inline_styles_count']}处），建议将样式移至外部CSS文件")
    
    if len(analysis["external_js"]) > 0 and any('jquery' in js.lower() for js in analysis["external_js"]):
        recommendations.append("考虑使用CDN版本的jQuery以提高加载速度")
    
    # 可访问性建议
    if len(analysis["images_without_alt"]) > 0:
        recommendations.append(f"为{len(analysis['images_without_alt'])}张图片添加alt属性，提升可访问性和SEO效果")
    
    return recommendations

if __name__ == "__main__":
    file_path = r"C:\Users\11466\Desktop\index.html"
    print(f"正在分析文件：{file_path}")
    
    analysis_result = analyze_html_file(file_path)
    
    if analysis_result:
        print("\n=== HTML文件分析结果 ===")
        print(f"文件路径：{analysis_result['file_path']}")
        print(f"文件大小：{analysis_result['file_size']} bytes")
        print(f"HTML版本：{analysis_result['html_version']}")
        print(f"标题：{analysis_result['title']}")
        print(f"使用的语义化标签：{', '.join(analysis_result['semantic_tags']) if analysis_result['semantic_tags'] else '无'}")
        print(f"外部CSS文件：{len(analysis_result['external_css'])}个")
        print(f"外部JS文件：{len(analysis_result['external_js'])}个")
        print(f"内联样式数量：{analysis_result['inline_styles_count']}")
        print(f"缺少alt属性的图片：{len(analysis_result['images_without_alt'])}张")
        
        print("\n=== 改进建议 ===")
        suggestions = generate_recommendations(analysis_result)
        if suggestions:
            for i, suggestion in enumerate(suggestions, 1):
                print(f"{i}. {suggestion}")
        else:
            print("未发现明显需要改进的地方，文件结构良好！")
    else:
        print("文件分析失败，请检查文件路径是否正确或文件是否损坏")
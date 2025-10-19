import argparse
import os
import sys
from src.agents.coordinator_agent import CoordinatorAgent
from src.formats.latex.utils import get_profect_dirs, batch_download_arxiv_tex, extract_compressed_files, get_arxiv_category, extract_arxiv_ids
from src.formats.latex.prompts import *
import subprocess
import streamlit
from tqdm import tqdm
from pathlib import Path

base_dir = os.getcwd()
sys.path.append(base_dir)

def main():
    """
    Main function to run the LaTeXTrans application.
    Allows overriding paper_list from command-line arguments.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="", help="(ignored) kept for compatibility.")
    #parser.add_argument("paper_ids", nargs="*", help="Optional list of arXiv paper IDs to override config.")
    parser.add_argument("--model", type=str, default="", help="Model for translating.")
    parser.add_argument("--url", type=str, default="", help="Model url.")
    parser.add_argument("--key", type=str, default="", help="Model key.")
    parser.add_argument("--arxiv", type=str, default="", help="arxiv paper ID.")
    parser.add_argument("--output", type=str, default="", help="output directory.")
    parser.add_argument("--source", type=str, default="", help="tex source directory.")
    # parser.add_argument("--GUI", "-g", action="store_true", help="Interact with GUI.")
    # parser.add_argument("--mode", type=int, default=2, help="Translate mode.")
    # parser.add_argument("--update_term", type=str, default="False", help="Update term or not.")
    # parser.add_argument("--tl", type=str, default="ch", help="Target language.")
    # parser.add_argument("--sl", type=str, default="en", help="Source language.")
    # parser.add_argument("--ut", type=str, default="", help="User's term dict.")
    # parser.add_argument("--save_config", type=str, default="", help="Path to save config.")
    # parser.add_argument("--valid", "-v", action="store_true", help="use valid agent.")
    # parser.add_argument("--filter", "-f", action="store_true", help="use filter agent.")

    args = parser.parse_args()

    # if args.GUI:
    #     current_dir = os.path.dirname(os.path.abspath(__file__))
    #     ui_path = os.path.join(current_dir, "src", "UI", "UI.py")
    #     subprocess.run(["streamlit", "run", ui_path])
    #     return 0

    # Build config from environment variables with CLI overrides (no TOML)
    llm_base_url = (args.url or os.environ.get("LTX_BASE_URL") or os.environ.get("BASE_URL") or "").strip()
    llm_api_key = (args.key or os.environ.get("LTX_API_KEY") or os.environ.get("API_KEY") or "").strip()
    llm_model = (args.model or os.environ.get("LTX_MODEL") or os.environ.get("MODEL") or "").strip()
    try:
        llm_concurrency = int(os.environ.get("LTX_CONCURRENCY", os.environ.get("CONCURRENCY", "10")))
    except ValueError:
        llm_concurrency = 10

    config = {
        "sys_name": os.environ.get("LTX_SYS_NAME", "LaTeXTrans"),
        "version": os.environ.get("LTX_VERSION", "0.1.0"),
        "target_language": os.environ.get("LTX_TARGET_LANGUAGE", "ch"),
        "source_language": os.environ.get("LTX_SOURCE_LANGUAGE", "en"),
        "paper_list": [],
        "tex_sources_dir": args.source or os.environ.get("LTX_TEX_SOURCES_DIR", "tex source"),
        "output_dir": args.output or os.environ.get("LTX_OUTPUT_DIR", "outputs"),
        "category": {},
        "update_term": os.environ.get("LTX_UPDATE_TERM", "False"),
        "mode": int(os.environ.get("LTX_MODE", "0")),
        "user_term": os.environ.get("LTX_USER_TERM", ""),
        "llm_config": {
            "model": llm_model,
            "api_key": llm_api_key,
            "base_url": llm_base_url,
            "concurrency": llm_concurrency,
        },
    }

    if args.arxiv:
        config["paper_list"].append(args.arxiv)
    # if args.mode:
    #     config["mode"] = args.mode
    # if args.update_term:
    #     config["update_term"] = args.update_term
    # if args.tl:
    #     config["target_language"] = args.tl
    # if args.sl:
    #     config["source_language"] = args.sl
    # paths already set above
    # if args.ut:
    #     config["user_term"] = args.ut

    #init_prompts(config["source_language"], config["target_language"])

    # override paper_list if user passed in IDs via CLI
    # if args.paper_ids:
    #     config["paper_list"] = args.paper_ids

    paper_list = config.get("paper_list", [])
    paper_list = extract_arxiv_ids(paper_list)
    projects_dir = os.path.join(base_dir, config.get("tex_sources_dir", "tex source"))
    output_dir = os.path.join(base_dir, config.get("output_dir", "outputs"))

    os.makedirs(projects_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    if paper_list:
        projects = batch_download_arxiv_tex(paper_list, projects_dir)
        if not config["user_term"] or args.mode == "0":
            config["category"] = get_arxiv_category(paper_list)
            # print(config["category"])
        extract_compressed_files(projects_dir)
    else:
        print("⚠️ No paper list provided. Using existing projects in the specified directory.")
        extract_compressed_files(projects_dir)
        projects = get_profect_dirs(projects_dir)
        if not projects:
            raise ValueError("❌ No projects found. Check 'tex_sources_dir' and 'paper_list' in config.")

    for project_dir in tqdm(projects, desc="Processing projects", unit="project"):

        try:

            LaTexTrans = CoordinatorAgent(
                config=config,
                project_dir=project_dir,
                output_dir=output_dir
            )
            LaTexTrans.workflow_latextrans()
        except Exception as e:
            print(f"❌ Error processing project {os.path.basename(project_dir)}: {e}")
            continue

    # config["paper_list"] = []
    # config["category"] = {}
    # if args.save_config:
    #     toml_str = toml.dumps(config)
    #     print(toml_str)
    #     toml_str = toml_str.replace("[category]", "category = {}")
    #     print(toml_str)
    #     config_path = Path(args.save_config) / "Myconfig.toml"
    #     config_path.parent.mkdir(parents=True, exist_ok=True)
    #     with open(config_path, "w") as f:
    #         f.write(toml_str)
    #     print(f"save config to {config_path}!")

if __name__ == "__main__":
    main()


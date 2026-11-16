"""notebooks/blast_thermal_runaway_logistic.py(# %% 셀) → .ipynb, 실행해 출력까지 담는다.
실행(저장소 맨 위에서): python3 code/make_notebook.py"""
import pathlib, re, nbformat
from nbclient import NotebookClient
R = pathlib.Path(__file__).resolve().parent.parent
src = (R / "notebooks/blast_thermal_runaway_logistic.py").read_text(encoding="utf-8")
cells = []
for blk in re.split(r"^# %%", src, flags=re.M)[1:]:
    head, _, body = blk.partition("\n")
    if "[markdown]" in head:
        md = "\n".join(l[2:] if l.startswith("# ") else l.lstrip("#") for l in body.strip("\n").splitlines())
        cells.append(nbformat.v4.new_markdown_cell(md))
    else:
        cells.append(nbformat.v4.new_code_cell(body.strip("\n")))
nb = nbformat.v4.new_notebook(cells=cells, metadata={"kernelspec": {"name": "python3", "display_name": "Python 3"}, "language_info": {"name": "python"}, "colab": {"provenance": []}})
NotebookClient(nb, timeout=300, kernel_name="python3", resources={"metadata": {"path": str(R)}}).execute()
nbformat.write(nb, R / "notebooks/blast_thermal_runaway_logistic.ipynb")
print("cells", len(cells), "ok")

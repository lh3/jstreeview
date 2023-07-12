## Getting Started
```sh
# open https://lh3.sourceforge.io/jstree/ in your browser for a live example, or
git clone https://github.com/lh3/jstreeview
# then open index.html in a web browser
```

## Introduction

This repo provides an interactive web application for viewing or editing
[phylogenetic trees][phylotree] in the New Hampshire (aka [Newick][newick])
format or the [NHX][nhx] format.  It supports subtree collapsing, subtree
highlighting, leaf searching and reording for viewing, and supports branch
swapping, multifurcation, reroot and arbitrary topology altering for editing.

Jstreeview is written in HTML and JavaScript. You may clone this repo and open
`index.html` to use it without installation. A running example can be found
[here](https://lh3.sourceforge.io/jstree/).

You can also use jstreeview as a library. File [example.html](example.html)
shows a minimal example.

## History

I created this project in 2008 initially for curating TreeFam trees. The source
code was managed by an obsolete version of subversion which is incompatible
with the latest subversion. Although I have not touched the source code for
over a decade, I have still used the viewer from time to time to visualize
phylogenetic trees.

Recently when I worked on GFA visualization, I realized that I could draw
sharper shapes and texts on HTML canvas, so I decide to update this project.
In addition, jstreeview was using a third-party text drawing library as few web
browsers supported text drawing in 2008. The update now supports built-in
canvas fonts.

Looking at my 15-year-old code, I think some design choices at the time are
questionable and may benefit from a revamp. I will leave this to another day, or
the project may never see the light of day.

[phylotree]: https://en.wikipedia.org/wiki/Phylogenetic_tree
[newick]: https://en.wikipedia.org/wiki/Newick_format
[nhx]: https://en.wikipedia.org/wiki/Newick_format#New_Hampshire_X_format

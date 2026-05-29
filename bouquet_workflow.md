# AI Bouquet Builder - Complete Workflow Documentation

## Project Overview

AI Bouquet Builder is an inventory-based bouquet creation platform where
the system contains a pre-built collection of standardized flower
assets. Users create bouquets by selecting flowers from the inventory
and arranging them intelligently.

------------------------------------------------------------------------

# Problem Statement

Traditional bouquet or floral design creation requires:

-   Searching for flower images
-   Removing backgrounds
-   Maintaining design consistency
-   Manual arrangement

The application solves this by providing:

-   Pre-created flower assets
-   Automatic bouquet arrangement
-   Random arrangement generation
-   Bouquet customization

------------------------------------------------------------------------

# Application Workflow

## Step 1: Pre-built Flower Inventory

The system already stores flower assets.

Example:

-   Rose
-   Sunflower
-   Tulip (Pink)
-   Tulip (White)
-   Tulip (Yellow)
-   Carnation (Red)
-   Carnation (Pink)
-   Carnation (Yellow)
-   Gerbera
-   Peony
-   Hydrangea
-   Baby's Breath

Each asset:

-   Has transparent background
-   Uses same flat-vector illustration style
-   Is normalized in size
-   Is reusable

------------------------------------------------------------------------

## Step 2: User Opens Bouquet Builder

Layout:

Left Panel: - Flower Inventory

Center: - Bouquet Canvas

Right Panel: - Controls

Controls:

-   Rotate
-   Resize
-   Remove
-   Shuffle Arrangement
-   Auto Arrange
-   Export

------------------------------------------------------------------------

## Step 3: Flower Selection

User selects flowers.

Example:

2 Sunflowers 3 Tulips 2 Roses 1 Baby's Breath

------------------------------------------------------------------------

## Step 4: Bouquet Arrangement Engine

The system creates an initial arrangement.

Flower Categories:

Primary Flowers: - Rose - Sunflower - Peony

Secondary Flowers: - Carnation - Gerbera - Tulips

Fillers: - Baby's Breath - Eucalyptus - Fern - Ruscus

------------------------------------------------------------------------

## Step 5: Bouquet Skeleton

Instead of random placement, flowers are positioned on predefined anchor
points.

Example:

        (1)

(2)  (3)

(3) (5) (6) (7) 

(4)  (9)

Each anchor stores:

-   x position
-   y position
-   scale
-   rotation
-   layer

------------------------------------------------------------------------

## Step 6: Shuffle Arrangement Feature

User presses:

Shuffle Arrangement

System:

1.  Keeps bouquet template
2.  Randomly swaps flower positions
3.  Slightly changes rotation
4.  Changes scale
5.  Changes depth

Result:

Every click creates a new bouquet style.

------------------------------------------------------------------------

## Step 7: Filler Assets

Required filler inventory:

Essential:

1.  Baby's Breath
2.  Eucalyptus
3.  Fern
4.  Ruscus

Optional:

5.  Berry stems
6.  Decorative grass
7.  Wax flowers

Purpose:

-   Fill gaps
-   Add volume
-   Create realistic bouquets

------------------------------------------------------------------------

## Step 8: Wrapping Layer

Wrapping paper should be added after arrangement generation.

Layer Order:

Flowers ↓ Fillers ↓ Wrapping Paper ↓ Ribbon

Possible Wrapping Types:

-   Kraft paper
-   White paper
-   Pastel wrapping
-   Transparent wrapping
-   Luxury wrapping

------------------------------------------------------------------------

## Step 9: User Customization

Users can:

-   Drag flowers
-   Resize
-   Rotate
-   Delete
-   Add fillers
-   Change wrapping
-   Add ribbons

------------------------------------------------------------------------

## Step 10: Export

Outputs:

-   PNG
-   SVG
-   PDF

------------------------------------------------------------------------

# Future Features

## User Image Upload

Users upload:

Real flower images

AI:

-   Removes background
-   Converts to vector style
-   Adds to inventory

------------------------------------------------------------------------

## AI Prompt Generation

Examples:

"Create a romantic bouquet"

"Create a wedding bouquet"

"Create a sunflower graduation bouquet"

AI automatically selects flowers.

------------------------------------------------------------------------

# MVP Summary

Flower Inventory ↓ User selects flowers ↓ Initial bouquet generation ↓
Shuffle arrangement ↓ Customize ↓ Add wrapping ↓ Export

------------------------------------------------------------------------

# One-line Definition

An AI-powered bouquet creation platform using a curated flower inventory
and intelligent arrangement generation.

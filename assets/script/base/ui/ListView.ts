const { ccclass, property, menu } = cc._decorator;
enum Direction {
    /**
     * !#en Vertical Layout
     * !#zh 垂直布局
     * @property {Number} VERTICAL
     */
    VERTICAL = 0,

    /**
     * !#en Horizontal Layout
     * !#zh 水平布局
     * @property {Number} HORIZONTAL
     */
    HORIZONTAL = 1,
}

type NodeType = cc.Node & { _itemIndex?: number, _sizeChangedCallback?: (node: cc.Node) => void };

enum EventType {
    ITEM_UPDATED = "ITEM_UPDATED",
}

/// <summary>
/// https://bitbucket.org/tacticsoft/tstableview.git 的修改版本
/// 主要去掉了DataSource TableViewItem，改成了通过设置itemCount，itemSizeGetter, bindItem 回调的方式。
/// 简化子物体，只支持单种模版。去掉了layout组件。
/// 增加水平方向。
/// </summary>
@ccclass
@menu("UI/ListView")
export default class ListView extends cc.Component {
    static EventType = EventType

    @property(cc.ScrollView)
    private scrollView: cc.ScrollView = null;

    @property(cc.Prefab)
    public itemTemplate: cc.Prefab = null;

    @property({ type: cc.Enum(Direction) })
    private direction: Direction = Direction.VERTICAL;

    @property
    private paddingTop: number = 0;

    @property
    private paddingBottom: number = 0;

    @property
    private paddingLeft: number = 0;

    @property
    private paddingRight: number = 0;

    @property
    private spacing: cc.Vec2 = cc.Vec2.ZERO;

    private count = 0;

    @property({ tooltip: "几列（垂直列表），几行（水平列表）" })
    private columnOrRow = 1;

    private requiresReload = true;
    private requiresRefresh = false;
    private layoutDirty = false;

    /**
     * 记录每个item的大小
     */
    private sizes: number[] = [];

    /**
     * 记录index之前的大小之和。
     */
    private cumulativeSizes: number[] = [];

    /**
     * 需要重新计算尺寸的开始索引
     */
    private cleanCumulativeIndex = 0;

    /**
     * 可见索引范围 [index0，index1)，不包含index1
     */
    private visibleStartIndex: number = 0;
    private visibleEndIndex: number = 0;

    private visibleItems: Map<number, NodeType> = new Map();

    private reusableItems: cc.NodePool = new cc.NodePool();

    public initialIndex = -1;

    public itemCallback: (node: cc.Node, index: number) => void;

    public get ScrollView() {
        return this.scrollView
    }

    public get isEmpty() {
        return this.count == 0;
    }

    public get itemCount() {
        return this.count;
    }

    public set itemCount(v: number) {
        this.count = v;
        this.requiresReload = true;
    }

    public initSpacing(spacing: cc.Vec2) {
        this.spacing.set(spacing)
    }

    public initColumnOrRow(columnOrRow: number) {
        this.columnOrRow = columnOrRow
    }

    public scrollToIndex(index: number, timeInSecond?: number) {
        if (index >= this.count || index < 0) {
            console.warn("超出列表范围");
            return;
        }
        let sz = this.cumulativeSizes[index] - this.sizes[index];
        if (!timeInSecond) {
            this.requiresRefresh = true
        }
        if (this.direction == Direction.HORIZONTAL) {
            this.scrollView.scrollToOffset(cc.v2(sz, 0), timeInSecond);
        }
        else {
            this.scrollView.scrollToOffset(cc.v2(0, sz), timeInSecond);
        }
    }

    public getNodeByIndex(index: number) {
        return this.visibleItems.get(index);
    }

    protected onEnable(): void {
        this.node.on("scrolling", this.onScrolling, this)
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this.onNodeSizeChanged, this)
    }

    protected onDisable(): void {
        this.node.off("scrolling", this.onScrolling, this)
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this.onNodeSizeChanged, this)
    }

    protected onLoad(): void {
        if (this.scrollView == null) {
            this.scrollView = this.getComponent(cc.ScrollView);
        }
    }

    protected update(dt: number): void {
        if (this.requiresReload) {
            this.reloadData();
        }
        if (this.requiresRefresh) {
            this.refreshVisibleItems();
        }
        if (this.layoutDirty) {
            this.layoutDirty = false;
            this.visibleItems.forEach(this.layoutItem, this);
        }
    }

    private onScrolling(): void {
        this.requiresRefresh = true;
    }

    private reloadData(): void {
        this.requiresReload = false;
        this.sizes.length = this.count;
        this.cumulativeSizes.length = this.count;
        this.cleanCumulativeIndex = -1;

        const itemSize = this.direction == Direction.HORIZONTAL ? this.itemTemplate.data.width : this.itemTemplate.data.height;
        for (let i = 0; i < this.count; i++) {
            this.sizes[i] = itemSize;
        }
        this.updateContentSize();

        if (this.initialIndex != -1) {
            this.scrollToIndex(this.initialIndex);
            this.initialIndex = -1;
        }
        this.setInitialVisibleItems();
    }

    private updateContentSize() {
        let size = this.getCumulativeSize(this.count - 1);
        if (this.direction == Direction.HORIZONTAL) {
            this.scrollView.content.width = size + this.paddingLeft + this.paddingRight;
        }
        else {
            this.scrollView.content.height = size + this.paddingBottom + this.paddingTop;
        }
    }

    private setItemSize(index: number, size: number) {
        if (Math.abs(this.sizes[index] - size) < 0.0001) {
            return;
        }

        this.sizes[index] = size;

        this.cleanCumulativeIndex = Math.min(this.cleanCumulativeIndex, (Math.floor(index / this.columnOrRow) * this.columnOrRow) - 1);

        this.updateContentSize();

        this.requiresRefresh = true;
        this.layoutDirty = true;
    }

    private setInitialVisibleItems(): void {
        this.setVisibleRange(0, 0);
        const { startIndex, endIndex } = this.calculateVisibleRange();
        this.setVisibleRange(startIndex, endIndex);
    }

    private insertItem(index: number, atEnd: boolean) {
        let node: NodeType = this.reusableItems.get() || cc.instantiate(this.itemTemplate);
        node.setParent(this.scrollView.content);
        if (!node._sizeChangedCallback) {
            node._sizeChangedCallback = () => this.onItemSizeChanged(node);
            node.on(cc.Node.EventType.SIZE_CHANGED, node._sizeChangedCallback, this)
        }
        node._itemIndex = index;
        if (atEnd) {
            node.setSiblingIndex(-1);
        }
        else {
            node.setSiblingIndex(0);
        }
        this.visibleItems.set(index, node);
        this.layoutItem(node, index);
        if (this.itemCallback) {
            this.itemCallback(node, index);
        }
        this.node.emit(EventType.ITEM_UPDATED, node, index);
    }

    private onItemSizeChanged(node: NodeType) {
        this.setItemSize(node._itemIndex, this.direction == Direction.HORIZONTAL ? node.width : node.height);
    }

    private onNodeSizeChanged() {
        this.refreshVisibleItems()
    }

    private removeItem(index: number) {
        let item = this.visibleItems.get(index);
        this.visibleItems.delete(index);
        this.reusableItems.put(item);
    }

    private refreshVisibleItems() {
        this.requiresRefresh = false;
        if (this.isEmpty) {
            return;
        }
        let { startIndex, endIndex } = this.calculateVisibleRange();

        this.setVisibleRange(startIndex, endIndex);
        // if (startIndex > this.visibleEndIndex || endIndex < this.visibleStartIndex) {
        //     this.recalculateVisibleItemsFromScratch();
        //     return;
        // }

        // for (let i = this.visibleStartIndex; i < startIndex; i++) {
        //     this.removeItem(i);
        // }

        // for (let i = endIndex; i < this.visibleEndIndex; i++) {
        //     this.removeItem(i);
        // }

        // for (let i = this.visibleStartIndex - 1; i >= startIndex; i--) {
        //     this.insertItem(i, false);
        // }

        // for (let i = this.visibleEndIndex; i < endIndex; i++) {
        //     this.insertItem(i, true);
        // }

        // this.visibleStartIndex = startIndex;
        // this.visibleEndIndex = endIndex;
    }

    private setVisibleRange(startIndex: number, endIndex: number) {
        if (startIndex != this.visibleStartIndex || endIndex != this.visibleEndIndex) {
            for (let i = this.visibleStartIndex, n = Math.min(startIndex, this.visibleEndIndex); i < n; i++) {
                this.removeItem(i);
            }

            for (let i = Math.max(endIndex, this.visibleStartIndex); i < this.visibleEndIndex; i++) {
                this.removeItem(i);
            }

            for (let i = Math.min(this.visibleStartIndex, endIndex) - 1; i >= startIndex; i--) {
                this.insertItem(i, false);
            }

            for (let i = Math.max(this.visibleEndIndex, startIndex); i < endIndex; i++) {
                this.insertItem(i, true);
            }

            this.visibleStartIndex = startIndex;
            this.visibleEndIndex = endIndex;
        }
    }

    private layoutItem(node: cc.Node, index: number) {
        if (this.direction == Direction.HORIZONTAL) {
            // 从上往下，从左到右 水平居中
            const height = this.itemTemplate.data.height;
            // 竖列的高度
            const h = height * this.columnOrRow + this.spacing.y * (this.columnOrRow - 1) + this.paddingTop + this.paddingBottom;
            const top = h * (1 - this.scrollView.content.anchorY);
            const offset = index - Math.floor(index / this.columnOrRow) * this.columnOrRow;
            const y = top - this.paddingTop - offset * this.spacing.y - node.anchorY * height - (index % this.columnOrRow) * height;
            const sz = this.sizes[index];
            const cumulativeSize = this.getCumulativeSize(index);
            const x = cumulativeSize - (1 - node.anchorX) * sz + this.paddingLeft;
            node.setPosition(x, y);
            node.width = sz;
        }
        else {
            //从左到右，从上往下 垂直居中
            const width = this.itemTemplate.data.width;
            const w = width * this.columnOrRow + this.spacing.x * (this.columnOrRow - 1) + this.paddingLeft + this.paddingRight;

            const left = w * (this.scrollView.content.anchorX - 1);
            var offset = index - Math.floor(index / this.columnOrRow) * this.columnOrRow;
            let x = left + this.paddingLeft + offset * this.spacing.x + node.anchorX * width + (index % this.columnOrRow) * width;
            const sz = this.sizes[index];
            var cumulativeSize = this.getCumulativeSize(index);
            let y = -(cumulativeSize - (node.anchorY) * sz + this.paddingTop);
            node.setPosition(x, y);
            node.height = sz;
        }
    }

    private calculateVisibleRange() {
        let startIndex: number;
        let endIndex: number = 0;
        let scrollOffset = this.scrollView.getScrollOffset();
        if (this.direction == Direction.HORIZONTAL) {
            let pos = -scrollOffset.x;
            let startX = Math.max(pos - this.paddingLeft, 0);
            let visiableLeftPadding = Math.max(this.paddingLeft - pos, 0);
            let endX = startX + this.node.width - visiableLeftPadding;

            startIndex = this.findIndexOfItemAt(startX);
            endIndex = this.findIndexOfItemAt(endX);
            endIndex = Math.floor(endIndex / this.columnOrRow) * this.columnOrRow + this.columnOrRow;
        }
        else {
            let pos = scrollOffset.y;
            let startY = Math.max(pos - this.paddingTop, 0);
            let visibleTopPadding = Math.max(this.paddingTop - pos, 0);
            let endY = startY + this.node.height - visibleTopPadding;

            startIndex = this.findIndexOfItemAt(startY);
            endIndex = this.findIndexOfItemAt(endY);
            endIndex = Math.floor(endIndex / this.columnOrRow) * this.columnOrRow + this.columnOrRow;
        }
        if (endIndex > this.count) {
            endIndex = this.count;
        }

        return { startIndex, endIndex };
    }

    private findIndexOfItemAt(pos: number) {
        return this._findIndexOfItemAt(pos, 0, this.count - 1);
    }

    private _findIndexOfItemAt(pos: number, startIndex: number, endIndex: number): number {
        if (startIndex >= endIndex) {
            return startIndex;
        }
        const middleIndex = (startIndex + endIndex) >> 1;
        let middlePos = this.getCumulativeSize(middleIndex);
        if (middlePos >= pos) {
            return this._findIndexOfItemAt(pos, startIndex, middleIndex);
        }
        else {
            return this._findIndexOfItemAt(pos, middleIndex + 1, endIndex);
        }
    }

    private getCumulativeSize(index: number) {
        if (index == -1) {
            return 0;
        }
        const spacing = this.direction == Direction.HORIZONTAL ? this.spacing.x : this.spacing.y;
        while (this.cleanCumulativeIndex < index) {
            this.cleanCumulativeIndex++;
            this.cumulativeSizes[this.cleanCumulativeIndex] = this.getMaxSize(this.cleanCumulativeIndex);
            var prevIndex = (Math.floor(this.cleanCumulativeIndex / this.columnOrRow) - 1) * this.columnOrRow;
            if (prevIndex >= 0) {
                this.cumulativeSizes[this.cleanCumulativeIndex] += this.cumulativeSizes[prevIndex] + spacing;
            }
        }
        return this.cumulativeSizes[index];
    }

    private getMaxSize(index: number): number {
        let max = 0;
        for (var i = 0; i < this.columnOrRow; i++) {
            var idx = Math.floor(index / this.columnOrRow) * this.columnOrRow + i;
            if (idx < this.sizes.length) {
                var size = this.sizes[idx];
                if (max < size) max = size;
            }
        }
        return max;
    }

    public isVisible(index: number) {
        return index >= this.visibleStartIndex && index <= this.visibleEndIndex
    }

    public get canPagePre() {
        return this.visibleStartIndex > 0
    }

    public get canPageNext() {
        const size = this.direction == Direction.VERTICAL ? this.ScrollView.node.height : this.ScrollView.node.width
        return this.cumulativeSizes[this.itemCount - 1] > size && this.visibleEndIndex < this.itemCount
    }

    public scrollToPageNext() {
        const index = this.visibleEndIndex - 1
        this.scrollToIndex(index, 0.1)
    }

    public scrollToPagePre() {
        const index = Math.max(0, this.visibleStartIndex - (this.visibleEndIndex - this.visibleStartIndex))
        this.scrollToIndex(index, 0.1)
    }

    protected onDestroy(): void {
        this.reusableItems.clear();
    }
}

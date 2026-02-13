import { Button } from "@components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// --- Shadcn-inspired pagination component --- //
type PaginationProps = {
    page: number;
    pageCount: number;
    onPrev: () => void;
    onNext: () => void;
    onPage: (num: number) => void;
    totalCount: number;
    pageSize: number;
    firstItemIdx: number;
    lastItemIdx: number;
};

export function Pagination({
    page,
    pageCount,
    onPrev,
    onNext,
    onPage,
    totalCount,
    pageSize,
    firstItemIdx,
    lastItemIdx,
}: PaginationProps) {
    // For large page counts, only show nearby numbers and first/last
    const siblings = 1;
    let pagesToShow: (number | string)[] = [];

    if (pageCount <= 7) {
        pagesToShow = Array.from({ length: pageCount }, (_, i) => i + 1);
    } else {
        pagesToShow.push(1);
        let left = Math.max(page - siblings, 2), right = Math.min(page + siblings, pageCount - 1);
        if (left > 2) pagesToShow.push("...");
        for (let i = left; i <= right; i++) pagesToShow.push(i);
        if (right < pageCount - 1) pagesToShow.push("...");
        pagesToShow.push(pageCount);
    }

    return (
        <div className="flex items-center justify-between gap-1 mt-4 w-full">
            {/* Data count display */}
            <div className="text-sm text-muted-foreground pr-1 pb-1 text-center">
                {totalCount === 0 ? (
                    "No results"
                ) : (
                    <>
                        Showing <span className="font-semibold">{firstItemIdx}</span>
                        {" – "}
                        <span className="font-semibold">{lastItemIdx}</span>
                        {" of "}
                        <span className="font-semibold">{totalCount}</span>
                    </>
                )}
            </div>
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onPrev}
                    disabled={page <= 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="size-4" />
                </Button>
                {pagesToShow.map((num, i) =>
                    typeof num === "number" ? (
                        <Button
                            key={num}
                            size="icon"
                            variant={num === page ? "default" : "ghost"}
                            onClick={() => onPage(num)}
                            aria-current={num === page}
                            aria-label={`Page ${num}`}
                            className={num === page ? "bg-primary text-white" : ""}
                        >
                            {num}
                        </Button>
                    ) : (
                        <span key={`ellipsis-${i}`} className="mx-1 text-sm text-muted-foreground">
                            &hellip;
                        </span>
                    )
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onNext}
                    disabled={page >= pageCount}
                    aria-label="Next page"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}
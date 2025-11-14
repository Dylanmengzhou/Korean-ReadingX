import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
export default function ArticleListPage() {
    return (
        <div>
            <div className="searchField"></div>
            <div className="articleList">
                <Card>
                    <CardHeader>
                        <CardTitle>文章标题</CardTitle>
                        <CardDescription>文章简短描述</CardDescription>
                    </CardHeader>
                    <CardContent>
                        文章内容预览...
                    </CardContent>
                    <CardFooter>
                        <CardAction>
                            阅读更多
                        </CardAction>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}
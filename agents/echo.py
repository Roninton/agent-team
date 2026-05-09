#!/usr/bin/env python3
import sys
import json

def main():
    print("Echo测试代理启动成功", file=sys.stderr)
    sys.stderr.flush()
    
    while True:
        line = sys.stdin.readline()
        if not line:
            break
            
        try:
            request = json.loads(line)
            if request.get('type') == 'message':
                content = request.get('content', '')
                response = {
                    "type": "message",
                    "content": f"Echo收到：{content}",
                    "metadata": {
                        "agent": "Echo测试代理",
                        "version": "1.0.0"
                    }
                }
                print(json.dumps(response), flush=True)
        except Exception as e:
            print(f"处理消息出错：{e}", file=sys.stderr)
            sys.stderr.flush()

if __name__ == "__main__":
    main()

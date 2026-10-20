import React from 'react';
import { Mic, Lightbulb, Music, Eye, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';

export const AuthenticityAdvisor: React.FC = () => {
  const recommendations = [
    {
      icon: Mic,
      title: 'إضافة تعليق صوتي شخصي (Original Voiceover)',
      desc: 'خوارزمية تيك توك تتعرف على بصمة الصوت الفريدة. إضافة شرح بصوتك أو قراءة تحليلية ترفع تصنيف الفيديو كـ «محتوى ذي قيمة مضافة» بدلًا من اعتباره إعادة نشر مكررة.'
    },
    {
      icon: Eye,
      title: 'خطف الانتباه في أول ثانيتين (Strong Hook)',
      desc: 'معدل الإكمال (Completion Rate) هو العامل الأكثر تأثيرًا في خوارزمية FYP. ابدأ مباشرة بالسؤال المحوري أو النتيجة المثيرة دون مقدمات بطيئة.'
    },
    {
      icon: Lightbulb,
      title: 'إضافة سياق أو زاوية نقدية أصلية',
      desc: 'عند استخدام مقاطع مرخصة، احرص على إضافة نصوص تفسيرية، مقارنات، أو ردود فعل حقيقية لتبرير الاستخدام العادل وتجنب وسم «Unoriginal Content».'
    },
    {
      icon: Music,
      title: 'استخدام الأصوات الرائجة داخل مكتبة TikTok',
      desc: 'بعد تجهيز الفيديو وتصديره بدون حقوق صوتية متعارضة، اختر مقطعًا صوتيًا أو مؤثرًا رائجًا من داخل تطبيق TikTok نفسه لزيادة فرص ظهوره في مسار التريند.'
    }
  ];

  return (
    <div className="space-y-6 text-right max-w-4xl mx-auto">
      {/* Policy Disclaimer Banner */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2.5 text-rose-400 font-semibold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>إخلاء مسؤولية النزاهة الفكرية وخوارزمية TikTok</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          تطبيق <span className="font-semibold text-white">TikTok Video Studio</span> يُعالج الجوانب التقنية مثل مقاس 9:16، ومعدل الإطارات الثابت لمنع التقطيع، وضغط البت، وإضافة هويتك البصرية. لكن القرار النهائي بشأن التوصية في صفحة لك (For You) يعتمد على جودة المحتوى واكتمال مشاهدته وأصالته. لا يمكن لأي برنامج ضمان قبول الفيديو تلقائيًا من الملف وحده.
        </p>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 hover:border-zinc-700 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-rose-400">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Checklist before publishing */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>قائمة التحقق الذهبية قبل النشر على حسابك</span>
        </h3>

        <div className="space-y-2.5 text-xs text-zinc-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>الفيديو مصمم بالأبعاد الرأسية الكاملة 9:16 دون أي أشرطة سوداء مشوهة.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>معدل الإطارات ثابت (CFR 30/60) والصوت متزامن تمامًا مع حركة الشفاه والصورة.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تم إضافة اسم المستخدم وعلامتك الشخصية لإثبات ملكيتك للمقطع وصناعته.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>العنوان والوصف يحتويان على هاشتاجات محددة للجمهور المستهدف بدلاً من الهاشتاجات العشوائية.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
